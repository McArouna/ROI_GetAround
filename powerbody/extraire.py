#!/usr/bin/env python3
"""Extraction des produits et des prix PowerBody, avec connexion au compte.

Exemples :
    python3 extraire.py                              # marque NOW Foods, marge 500 DA
    python3 extraire.py --marge 800 --arrondi 100
    python3 extraire.py --url "https://fr.powerbody.eu/marque-optimum,12.html"
    python3 extraire.py --login-manuel               # 1re fois : connexion à la main
    python3 extraire.py --fichiers page1.html        # sans navigateur, page enregistrée

Les identifiants ne sont jamais écrits dans le code : ils viennent du fichier
.env (voir .env.exemple) ou des variables d'environnement.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import pathlib
import re
import sys
import time
from urllib.parse import urlparse, urlsplit, urlunsplit

ICI = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ICI))

from parsing import derniere_page, est_connecte, extraire_produits  # noqa: E402
from tarifs import TAUX_PARALLELE, calculer_ligne  # noqa: E402

URL_DEFAUT = "https://fr.powerbody.eu/marque-now-foods,9.html"
URL_LOGIN_DEFAUT = "https://fr.powerbody.eu/customer/account/login/"

SEL_EMAIL = [
    "#email",
    "input[name='login[username]']",
    "input[name='email']",
    "input[type='email']",
]
SEL_MDP = [
    "#pass",
    "input[name='login[password]']",
    "input[name='password']",
    "input[type='password']",
]
SEL_VALIDER = [
    "#send2",
    "button.action.login",
    "button[type='submit']",
    "input[type='submit']",
]
SEL_COOKIES = [
    "#btn-cookie-allow",
    "#onetrust-accept-btn-handler",
    "button#accept-cookies",
    ".cookie-accept",
    "button:has-text('Tout accepter')",
    "button:has-text('Accepter')",
    "button:has-text('J\\'accepte')",
    "a:has-text('Accepter')",
]


# ---------- petites aides ----------


def journal(message: str) -> None:
    print(message, flush=True)


def charger_env(chemin: pathlib.Path) -> None:
    """Lit un .env minimal (CLE=valeur) sans dépendance externe."""
    if not chemin.is_file():
        return
    for ligne in chemin.read_text(encoding="utf-8").splitlines():
        ligne = ligne.strip()
        if not ligne or ligne.startswith("#") or "=" not in ligne:
            continue
        cle, _, valeur = ligne.partition("=")
        os.environ.setdefault(cle.strip(), valeur.strip().strip("'\""))


def url_page(url: str, numero: int) -> str:
    """Ajoute ?p=N à une url de listing en gardant les paramètres existants."""
    if numero <= 1:
        return url
    parties = urlsplit(url)
    params = [p for p in parties.query.split("&") if p and not p.startswith("p=")]
    params.append(f"p={numero}")
    return urlunsplit(parties._replace(query="&".join(params)))


def racine(url: str) -> str:
    p = urlparse(url)
    return f"{p.scheme}://{p.netloc}"


def cliquer_si_present(page, selecteurs, timeout=1500) -> bool:
    for sel in selecteurs:
        try:
            el = page.locator(sel).first
            if el.count() and el.is_visible(timeout=timeout):
                el.click(timeout=timeout)
                page.wait_for_timeout(400)
                return True
        except Exception:
            continue
    return False


def remplir(page, selecteurs, valeur) -> bool:
    for sel in selecteurs:
        try:
            el = page.locator(sel).first
            if el.count():
                el.fill(valeur, timeout=4000)
                return True
        except Exception:
            continue
    return False


def aller(page, url: str, essais: int = 4) -> str:
    """Navigation avec reprise en cas d'aléa réseau (2s, 4s, 8s)."""
    dernier = None
    for essai in range(essais):
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            try:
                page.wait_for_load_state("networkidle", timeout=8000)
            except Exception:
                pass
            return page.content()
        except Exception as err:  # noqa: BLE001
            dernier = err
            attente = 2 ** (essai + 1)
            journal(f"   ! échec réseau ({err.__class__.__name__}), reprise dans {attente}s")
            time.sleep(attente)
    raise RuntimeError(f"Impossible de charger {url} : {dernier}")


# ---------- connexion ----------


def connexion(page, url_login: str, email: str, mdp: str) -> bool:
    journal("-> connexion au compte…")
    aller(page, url_login)
    cliquer_si_present(page, SEL_COOKIES)
    if not page.locator(", ".join(SEL_MDP)).count():
        # la page de connexion n'est pas là où on croyait : on la cherche
        for lien in ("a[href*='customer/account/login']", "a:has-text('Connexion')", "a:has-text('Se connecter')"):
            try:
                if page.locator(lien).first.count():
                    page.locator(lien).first.click(timeout=5000)
                    page.wait_for_load_state("domcontentloaded")
                    break
            except Exception:
                continue
    if not remplir(page, SEL_EMAIL, email) or not remplir(page, SEL_MDP, mdp):
        journal("   ! champs de connexion introuvables (utilisez --login-manuel)")
        return False
    cliquer_si_present(page, SEL_VALIDER, timeout=5000)
    try:
        page.wait_for_load_state("networkidle", timeout=15000)
    except Exception:
        pass
    ok = est_connecte(page.content())
    journal("   connecté." if ok else "   ! la connexion semble avoir échoué")
    return ok


def login_manuel(page, url_login: str) -> bool:
    aller(page, url_login)
    cliquer_si_present(page, SEL_COOKIES)
    journal("\n   >>> Connectez-vous dans la fenêtre du navigateur, puis revenez ici.")
    input("   >>> Appuyez sur Entrée une fois connecté… ")
    return est_connecte(page.content())


# ---------- récolte ----------


def recolter_en_ligne(args) -> list:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        journal(
            "Playwright n'est pas installé.\n"
            "  pip install playwright && playwright install chromium\n"
            "Ou utilisez --fichiers avec des pages enregistrées depuis votre navigateur."
        )
        sys.exit(2)

    email = args.email or os.environ.get("POWERBODY_EMAIL", "")
    mdp = args.motdepasse or os.environ.get("POWERBODY_MOTDEPASSE", "")
    etat = pathlib.Path(args.etat)
    produits, pages_vides = [], 0

    with sync_playwright() as pw:
        navigateur = pw.chromium.launch(headless=not (args.headful or args.login_manuel))
        contexte = navigateur.new_context(
            storage_state=str(etat) if etat.is_file() else None,
            locale="fr-FR",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
        )
        page = contexte.new_page()
        try:
            connecte = False
            if etat.is_file():
                html = aller(page, args.urls[0])
                connecte = est_connecte(html)
                journal("-> session réutilisée." if connecte else "-> session expirée.")
            if not connecte:
                if args.login_manuel:
                    connecte = login_manuel(page, args.url_login)
                elif email and mdp:
                    connecte = connexion(page, args.url_login, email, mdp)
                else:
                    journal(
                        "-> aucun identifiant fourni : extraction des prix publics.\n"
                        "   (renseignez .env ou lancez --login-manuel pour vos prix de compte)"
                    )
            if connecte:
                contexte.storage_state(path=str(etat))
                journal(f"-> session enregistrée dans {etat}")

            for url in args.urls:
                journal(f"\n-> {url}")
                total_pages = args.pages_max
                for numero in range(1, args.pages_max + 1):
                    cible = url_page(url, numero)
                    html = aller(page, cible)
                    if numero == 1:
                        cliquer_si_present(page, SEL_COOKIES)
                        html = page.content()
                        if not est_connecte(html):
                            journal("   ! attention : prix publics (non connecté)")
                        total_pages = min(args.pages_max, max(1, derniere_page(html)))
                        journal(f"   {total_pages} page(s) de résultats")
                    if args.dump:
                        chemin = pathlib.Path(args.sortie) / "html"
                        chemin.mkdir(parents=True, exist_ok=True)
                        nom = re.sub(r"\W+", "_", cible)[-80:] + ".html"
                        (chemin / nom).write_text(html, encoding="utf-8")
                    lot = extraire_produits(html, cible, args.strategie)
                    journal(f"   page {numero} : {len(lot)} produit(s)")
                    if not lot:
                        pages_vides += 1
                        if pages_vides >= 2:
                            break
                    for p in lot:
                        p_dict = p.dict()
                        p_dict["page"] = cible
                        produits.append(p_dict)
                    if numero >= total_pages:
                        break
                    time.sleep(args.delai)
        finally:
            contexte.close()
            navigateur.close()
    return produits


def recolter_fichiers(args) -> list:
    produits = []
    for chemin in args.fichiers:
        fichier = pathlib.Path(chemin)
        html = fichier.read_text(encoding="utf-8", errors="ignore")
        lot = extraire_produits(html, args.urls[0], args.strategie)
        journal(f"-> {fichier.name} : {len(lot)} produit(s)")
        for p in lot:
            d = p.dict()
            d["page"] = fichier.name
            produits.append(d)
    return produits


# ---------- export ----------


def dedoublonner(produits: list) -> list:
    vus, sortie = set(), []
    for p in produits:
        cle = (p.get("url") or p.get("nom", "")).strip().lower()
        if not cle or cle in vus:
            continue
        vus.add(cle)
        sortie.append(p)
    return sortie


def enrichir(produits: list, args) -> list:
    for p in produits:
        p.update(
            calculer_ligne(
                p.get("prix_eur"),
                taux=args.taux,
                mode=args.mode,
                marge=args.marge,
                frais_da=args.frais,
                arrondi=args.arrondi,
            )
        )
    return produits


COLONNES = [
    ("nom", "Produit"),
    ("sku", "Réf."),
    ("dispo", "Dispo"),
    ("prix_eur", "Achat EUR"),
    ("prix_barre_eur", "Prix barré EUR"),
    ("achat_da", "Achat DA"),
    ("frais_da", "Frais DA"),
    ("revient_da", "Revient DA"),
    ("vente_da", "Vente DA"),
    ("marge_da", "Marge DA"),
    ("marge_pct", "Marge %"),
    ("url", "Lien"),
]


def fr(valeur):
    if isinstance(valeur, float):
        return f"{valeur:.2f}".replace(".", ",")
    return "" if valeur is None else valeur


def exporter(produits: list, args) -> dict:
    dossier = pathlib.Path(args.sortie)
    dossier.mkdir(parents=True, exist_ok=True)
    reglages = {
        "taux": args.taux,
        "mode": args.mode,
        "marge": args.marge,
        "frais": args.frais,
        "arrondi": args.arrondi,
        "extrait_le": time.strftime("%Y-%m-%d %H:%M"),
        "sources": args.urls if not args.fichiers else args.fichiers,
    }
    charge = {"reglages": reglages, "produits": produits}

    (dossier / "produits.json").write_text(
        json.dumps(charge, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (dossier / "donnees.js").write_text(
        "window.PB_EXPORT = " + json.dumps(charge, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    with (dossier / "produits.csv").open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow([titre for _, titre in COLONNES])
        for p in produits:
            writer.writerow([fr(p.get(cle)) for cle, _ in COLONNES])
    return {"dossier": dossier, "reglages": reglages}


# ---------- entrée ----------


def analyser_arguments(argv=None):
    a = argparse.ArgumentParser(
        description="Extrait les produits PowerBody et calcule les prix de vente en dinars.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    a.add_argument("--url", dest="urls", action="append", help="page de marque/catégorie à extraire")
    a.add_argument("--url-login", default=URL_LOGIN_DEFAUT)
    a.add_argument("--email", default="")
    a.add_argument("--motdepasse", default="")
    a.add_argument("--login-manuel", action="store_true", help="ouvre le navigateur pour se connecter à la main")
    a.add_argument("--headful", action="store_true", help="afficher le navigateur")
    a.add_argument("--etat", default=str(ICI / "session.json"), help="fichier de session réutilisable")
    a.add_argument("--fichiers", nargs="+", help="analyser des pages HTML enregistrées (sans navigateur)")
    a.add_argument("--strategie", choices=["conteneurs", "microdata", "heuristique", "json-ld"])
    a.add_argument("--pages-max", type=int, default=30)
    a.add_argument("--delai", type=float, default=1.5, help="pause entre deux pages, en secondes")
    a.add_argument("--dump", action="store_true", help="conserver le HTML brut (diagnostic)")
    a.add_argument("--sortie", default=str(ICI / "export"))
    a.add_argument("--taux", type=float, default=TAUX_PARALLELE, help="1 EUR = X DA")
    a.add_argument("--mode", choices=["da", "pct", "eur"], default="da", help="unité de la marge")
    a.add_argument("--marge", type=float, default=500.0, help="marge voulue (DA, %% ou EUR selon --mode)")
    a.add_argument("--frais", type=float, default=0.0, help="frais par produit, en DA")
    a.add_argument("--arrondi", type=float, default=0.0, help="arrondir le prix de vente au multiple supérieur")
    args = a.parse_args(argv)
    args.urls = args.urls or [URL_DEFAUT]
    return args


def main(argv=None) -> int:
    charger_env(ICI / ".env")
    charger_env(pathlib.Path.cwd() / ".env")
    args = analyser_arguments(argv)

    produits = recolter_fichiers(args) if args.fichiers else recolter_en_ligne(args)
    produits = enrichir(dedoublonner(produits), args)
    if not produits:
        journal(
            "\nAucun produit extrait. Pistes :\n"
            "  - relancez avec --headful --dump pour voir la page et garder le HTML\n"
            "  - essayez --strategie heuristique\n"
            "  - ou enregistrez la page depuis votre navigateur (Ctrl+S) puis --fichiers page.html"
        )
        return 1

    info = exporter(produits, args)
    prix = [p["prix_eur"] for p in produits if p.get("prix_eur")]
    journal(
        f"\n{len(produits)} produits exportés dans {info['dossier']}"
        f"\n  prix d'achat de {min(prix):.2f} € à {max(prix):.2f} €"
        f"\n  taux {args.taux:g} DA/€, marge {args.marge:g} ({args.mode})"
        f"\n\nOuvrez powerbody/tarificateur.html pour ajuster la marge et le taux."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
