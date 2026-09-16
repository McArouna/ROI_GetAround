"""Extraction des produits et des prix depuis une page de listing PowerBody.

Le module ne fait aucun accès réseau : il prend du HTML et rend des produits.
Plusieurs stratégies sont tentées dans l'ordre, de la plus fiable (le prix
réellement affiché dans la page, donc le prix de votre compte une fois
connecté) à la plus générique.
"""

from __future__ import annotations

import copy
import json
import re
from dataclasses import asdict, dataclass
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

NBSP = " "

# ---------- prix ----------

# le \b est volontairement absent après « € » : ce n'est pas un caractère de mot,
# une limite de mot n'existe donc pas entre « € » et la fin de la chaîne.
_PRIX_RE = re.compile(r"€\s*([0-9][0-9\s.,]*)|([0-9][0-9\s.,]*)\s*(?:€|EUR\b)", re.I)


def _vers_float(brut: str) -> float | None:
    brut = re.sub(r"[\s ]", "", brut).strip().strip(".,")
    if not brut or not re.fullmatch(r"[0-9.,]+", brut):
        return None
    seps = [c for c in brut if c in ".,"]
    if not seps:
        nombre = brut
    else:
        pos = max(brut.rfind(","), brut.rfind("."))
        decimales = len(brut) - pos - 1
        # « 1.234 » ou « 1,234 » : séparateur de milliers, pas de décimales
        if decimales == 3 and len(seps) == 1:
            nombre = re.sub(r"[.,]", "", brut)
        else:
            nombre = re.sub(r"[.,]", "", brut[:pos]) + "." + brut[pos + 1 :]
    try:
        valeur = float(nombre)
    except ValueError:
        return None
    return valeur if valeur > 0 else None


def parse_prix(texte: str | None) -> float | None:
    """Lit « 24,90 € », « €24.90 », « 1 234,56 EUR » -> float."""
    if texte is None:
        return None
    texte = str(texte).replace(NBSP, " ")
    m = _PRIX_RE.search(texte)
    if m:
        return _vers_float(m.group(1) or m.group(2))
    if re.fullmatch(r"[\s0-9.,]+", texte.strip()) and texte.strip():
        return _vers_float(texte)
    return None


# ---------- modèle ----------


@dataclass
class Produit:
    nom: str
    url: str = ""
    sku: str = ""
    prix_eur: float | None = None
    prix_barre_eur: float | None = None
    dispo: str = ""
    image: str = ""
    strategie: str = ""

    def cle(self) -> str:
        return (self.url or self.nom).strip().lower()

    def dict(self) -> dict:
        return asdict(self)


# ---------- sélecteurs ----------

SEL_BLOCS = [
    "li.item.product.product-item",
    "li.product-item",
    "div.product-item",
    ".products-grid li.item",
    ".products-list li.item",
    ".category-products li.item",
    "li.item-product",
    "article.product",
    "div.product-box",
    ".product-listing .item",
    "li.item",
]

SEL_NOM = [
    "a.product-item-link",
    ".product-item-name a",
    ".product-name a",
    "h2.product-name a",
    "h3.product-name a",
    ".name a",
    "h2 a",
    "h3 a",
    "h4 a",
    ".product-item-name",
    ".product-name",
]

SEL_PRIX_BARRE = [
    ".old-price",
    ".price-box .old-price",
    "[data-price-type='oldPrice']",
    ".regular-price-crossed",
    ".price-old",
    "del",
    "s",
]

SEL_PRIX_FINAL = [
    ".special-price .price",
    ".special-price",
    "[data-price-type='finalPrice'] .price",
    ".price-final_price .price",
    ".price-box .regular-price .price",
    ".regular-price .price",
    ".price-including-tax .price",
    "[itemprop='price']",
    ".product-price .price",
    ".price",
]

MOTS_DISPO = {
    "en stock": "En stock",
    "in stock": "En stock",
    "disponible": "En stock",
    "rupture": "Rupture",
    "indisponible": "Indisponible",
    "out of stock": "Rupture",
    "épuisé": "Rupture",
    "epuise": "Rupture",
}


def _texte(el) -> str:
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)).strip() if el else ""


def _prix_de_element(el) -> float | None:
    if el is None:
        return None
    for attr in ("content", "data-price-amount", "data-price"):
        if el.has_attr(attr):
            v = _vers_float(str(el[attr]))
            if v:
                return v
    return parse_prix(_texte(el))


def _extraire_prix(bloc) -> tuple[float | None, float | None]:
    """Rend (prix final, prix barré). Le prix barré est retiré avant de
    chercher le prix final, sinon on lit l'ancien prix à sa place."""
    bloc = copy.copy(bloc)
    barre = None
    for sel in SEL_PRIX_BARRE:
        for el in bloc.select(sel):
            barre = barre or _prix_de_element(el)
            el.decompose()
    final = None
    for sel in SEL_PRIX_FINAL:
        for el in bloc.select(sel):
            final = _prix_de_element(el)
            if final:
                break
        if final:
            break
    if final is None:
        final = parse_prix(_texte(bloc))
    if final and barre and barre < final:
        final, barre = barre, final
    return final, barre


def _dispo(bloc) -> str:
    texte = _texte(bloc).lower()
    for mot, etiquette in MOTS_DISPO.items():
        if mot in texte:
            return etiquette
    return ""


def _lien_produit(bloc, base_url: str) -> tuple[str, str]:
    """Rend (nom, url) du produit d'un bloc."""
    for sel in SEL_NOM:
        el = bloc.select_one(sel)
        if el is not None and _texte(el):
            href = el.get("href") or (el.find("a") or {}).get("href") or ""
            return _texte(el), urljoin(base_url, href) if href else ""
    for a in bloc.find_all("a", href=True):
        nom = _texte(a)
        if not nom:
            img = a.find("img")
            nom = (img.get("alt") or "").strip() if img else ""
        if nom and len(nom) > 3 and "€" not in nom:
            return nom, urljoin(base_url, a["href"])
    img = bloc.find("img")
    if img and img.get("alt"):
        return img["alt"].strip(), ""
    return "", ""


def _image(bloc, base_url: str) -> str:
    img = bloc.find("img")
    if not img:
        return ""
    src = img.get("src") or img.get("data-src") or img.get("data-original") or ""
    return urljoin(base_url, src) if src else ""


def _sku(bloc, url: str) -> str:
    el = bloc.select_one("[itemprop='sku'], .sku, .product-sku")
    if el:
        return re.sub(r"^(sku|réf\.?|ref\.?)\s*:?\s*", "", _texte(el), flags=re.I)
    m = re.search(r"[,-](\d{3,})\.html", url or "")
    return m.group(1) if m else ""


def _produit_du_bloc(bloc, base_url: str, strategie: str) -> Produit | None:
    nom, url = _lien_produit(bloc, base_url)
    if not nom:
        return None
    prix, barre = _extraire_prix(bloc)
    if prix is None:
        return None
    return Produit(
        nom=nom,
        url=url,
        sku=_sku(bloc, url),
        prix_eur=prix,
        prix_barre_eur=barre,
        dispo=_dispo(bloc),
        image=_image(bloc, base_url),
        strategie=strategie,
    )


# ---------- stratégies ----------


def _par_conteneurs(soup, base_url: str) -> list[Produit]:
    meilleur: list[Produit] = []
    for sel in SEL_BLOCS:
        blocs = soup.select(sel)
        if not blocs:
            continue
        produits = []
        for bloc in blocs:
            p = _produit_du_bloc(bloc, base_url, f"conteneur:{sel}")
            if p:
                produits.append(p)
        if len(produits) > len(meilleur):
            meilleur = produits
        if len(meilleur) >= 4:
            break
    return meilleur


def _par_microdata(soup, base_url: str) -> list[Produit]:
    blocs = [
        el
        for el in soup.select("[itemtype]")
        if "product" in (el.get("itemtype") or "").lower()
    ]
    produits = []
    for bloc in blocs:
        nom_el = bloc.select_one("[itemprop='name']")
        nom = _texte(nom_el) or (nom_el.get("content") if nom_el else "") or ""
        prix = _prix_de_element(bloc.select_one("[itemprop='price']"))
        if not nom or not prix:
            p = _produit_du_bloc(bloc, base_url, "microdata")
            if p:
                produits.append(p)
            continue
        lien = bloc.select_one("[itemprop='url'], a[href]")
        produits.append(
            Produit(
                nom=nom.strip(),
                url=urljoin(base_url, lien.get("href", "")) if lien else "",
                sku=_texte(bloc.select_one("[itemprop='sku']")),
                prix_eur=prix,
                prix_barre_eur=_extraire_prix(bloc)[1],
                dispo=_dispo(bloc),
                image=_image(bloc, base_url),
                strategie="microdata",
            )
        )
    return produits


def _aplatir_jsonld(noeud):
    if isinstance(noeud, list):
        for x in noeud:
            yield from _aplatir_jsonld(x)
    elif isinstance(noeud, dict):
        yield noeud
        for cle in ("@graph", "itemListElement", "item", "mainEntity"):
            if cle in noeud:
                yield from _aplatir_jsonld(noeud[cle])


def _par_jsonld(soup, base_url: str) -> list[Produit]:
    produits = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            donnees = json.loads(script.string or script.get_text() or "{}")
        except (json.JSONDecodeError, TypeError):
            continue
        for noeud in _aplatir_jsonld(donnees):
            types = noeud.get("@type", "")
            types = types if isinstance(types, list) else [types]
            if not any("product" in str(t).lower() for t in types):
                continue
            offres = noeud.get("offers") or {}
            if isinstance(offres, list):
                offres = offres[0] if offres else {}
            prix = _vers_float(str(offres.get("price", ""))) if offres else None
            nom = str(noeud.get("name", "")).strip()
            if not nom or not prix:
                continue
            image = noeud.get("image")
            if isinstance(image, list):
                image = image[0] if image else ""
            produits.append(
                Produit(
                    nom=nom,
                    url=urljoin(base_url, str(noeud.get("url", ""))),
                    sku=str(noeud.get("sku", "") or noeud.get("mpn", "")),
                    prix_eur=prix,
                    dispo="Rupture"
                    if "outofstock" in str(offres.get("availability", "")).lower()
                    else "",
                    image=str(image or ""),
                    strategie="json-ld",
                )
            )
    return produits


def _par_heuristique(soup, base_url: str) -> list[Produit]:
    """Dernier recours : on part de chaque prix visible et on remonte
    jusqu'au bloc qui contient aussi un lien produit."""
    produits: list[Produit] = []
    vus = set()
    for noeud in soup.find_all(string=_PRIX_RE):
        parent = noeud.parent
        for _ in range(7):
            if parent is None or parent.name in ("body", "html"):
                break
            liens = [a for a in parent.find_all("a", href=True) if _texte(a)]
            if liens:
                cle = id(parent)
                if cle in vus:
                    break
                vus.add(cle)
                p = _produit_du_bloc(parent, base_url, "heuristique")
                if p:
                    produits.append(p)
                break
            parent = parent.parent
    return produits


STRATEGIES = {
    "conteneurs": _par_conteneurs,
    "microdata": _par_microdata,
    "heuristique": _par_heuristique,
    "json-ld": _par_jsonld,
}


def extraire_produits(html: str, base_url: str = "", strategie: str | None = None) -> list[Produit]:
    """Rend la liste des produits trouvés dans une page de listing."""
    soup = BeautifulSoup(html or "", "lxml")
    ordre = [strategie] if strategie else ["conteneurs", "microdata", "heuristique", "json-ld"]
    for nom in ordre:
        fonction = STRATEGIES.get(nom)
        if fonction is None:
            raise ValueError(f"Stratégie inconnue : {nom}")
        produits = _dedoublonner(fonction(soup, base_url))
        if produits:
            return produits
    return []


def _dedoublonner(produits: list[Produit]) -> list[Produit]:
    vus, sortie = set(), []
    for p in produits:
        cle = p.cle()
        if not cle or cle in vus:
            continue
        vus.add(cle)
        sortie.append(p)
    return sortie


# ---------- pagination / session ----------


def derniere_page(html: str) -> int:
    """Numéro de la dernière page trouvé dans les liens de pagination."""
    soup = BeautifulSoup(html or "", "lxml")
    maxi = 1
    for a in soup.find_all("a", href=True):
        m = re.search(r"[?&]p=(\d+)", a["href"])
        if m:
            maxi = max(maxi, int(m.group(1)))
        elif re.fullmatch(r"\d{1,3}", _texte(a)):
            classes = " ".join(a.parent.get("class", []) + a.get("class", [])) if a.parent else ""
            if "page" in classes.lower():
                maxi = max(maxi, int(_texte(a)))
    return maxi


MARQUEURS_CONNECTE = (
    "customer/account/logout",
    "se déconnecter",
    "déconnexion",
    "log out",
    "logout",
    "mon compte",
)


def est_connecte(html: str) -> bool:
    bas = (html or "").lower()
    return any(m in bas for m in MARQUEURS_CONNECTE)
