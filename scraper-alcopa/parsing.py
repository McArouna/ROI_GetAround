"""Extraction des véhicules depuis le HTML d'une page de résultats Alcopa.

Cette couche ne connaît ni le réseau ni Playwright : elle prend du HTML et
rend des dictionnaires. C'est ce qui permet de la tester sur un fichier
sauvegardé, sans toucher au site.
"""

import re
import unicodedata

from bs4 import BeautifulSoup

from config import FRAGMENT_URL_FICHE, SELECTEURS

# Alcopa affiche soit l'enchère en cours, soit la mise à prix quand aucune
# enchère n'a encore été portée. La distinction compte : une mise à prix est
# un point de départ, pas un prix de marché.
PRIX_ENCHERE = "enchere_courante"
PRIX_MISE_A_PRIX = "mise_a_prix"

_RE_ENCHERE = re.compile(r"Ench[eè]re courante\s*:?\s*([\d\s]+)\s*€", re.I)
_RE_MISE_A_PRIX = re.compile(r"Mise [aà] prix\s*:?\s*([\d\s]+)\s*€", re.I)
_RE_ANNEE = re.compile(r"1[èe]re mise\s*:?\s*(?:\d{1,2}/)?(\d{4})", re.I)
_RE_KM = re.compile(r"([\d\s]+)\s*km\b", re.I)
_RE_LOT = re.compile(r"Lot\s*n°\s*(\d+)", re.I)
_RE_ID_FICHE = re.compile(r"-(\d+)$")


def _normaliser(texte):
    """Aplatit les espaces, y compris les espaces insécables des prix."""
    if not texte:
        return ""
    texte = unicodedata.normalize("NFKC", texte)
    return re.sub(r"\s+", " ", texte).strip()


def _nombre(brut):
    """'247 123' -> 247123. Rend None si rien d'exploitable."""
    chiffres = re.sub(r"\D", "", brut or "")
    return int(chiffres) if chiffres else None


def _texte(noeud, selecteur):
    trouve = noeud.select_one(selecteur)
    return _normaliser(trouve.get_text()) if trouve else ""


def _lignes(noeud, selecteur):
    """Rend les lignes d'un bloc, en conservant les coupures <br>.

    Indispensable ici : l'année et le kilométrage sont deux lignes voisines
    ("1ère mise : 2014" puis "181 331 km"). Aplaties, elles se collent et
    deviennent un seul nombre.
    """
    trouve = noeud.select_one(selecteur)
    if not trouve:
        return []
    brut = trouve.get_text(separator="\n")
    return [_normaliser(ligne) for ligne in brut.split("\n") if _normaliser(ligne)]


def _chercher_lignes(motif, lignes):
    """Première correspondance du motif parmi les lignes."""
    for ligne in lignes:
        correspondance = motif.search(ligne)
        if correspondance:
            return correspondance
    return None


def _extraire_prix(texte_pied):
    """Rend (montant, type_de_prix). Le type qualifie ce que vaut le montant."""
    correspondance = _RE_ENCHERE.search(texte_pied)
    if correspondance:
        return _nombre(correspondance.group(1)), PRIX_ENCHERE

    correspondance = _RE_MISE_A_PRIX.search(texte_pied)
    if correspondance:
        return _nombre(correspondance.group(1)), PRIX_MISE_A_PRIX

    return None, None


def _extraire_titre(carte):
    """'RENAULT | CLIO V' -> ('RENAULT', 'CLIO V')."""
    titre = _texte(carte, SELECTEURS["titre"])
    if "|" in titre:
        marque, _, modele = titre.partition("|")
        return marque.strip(), modele.strip()
    return "", titre


def _est_carte_vehicule(carte):
    lien = carte.select_one(SELECTEURS["titre"])
    return bool(lien and FRAGMENT_URL_FICHE in lien.get("href", ""))


def parser_carte(carte):
    """Transforme une carte en dictionnaire véhicule."""
    marque, modele = _extraire_titre(carte)
    lien = carte.select_one(SELECTEURS["titre"])
    url = lien.get("href", "") if lien else ""

    lignes = _lignes(carte, SELECTEURS["details"])
    pied = carte.select_one(SELECTEURS["pied"])
    texte_pied = _normaliser(pied.get_text()) if pied else ""

    prix, type_prix = _extraire_prix(texte_pied)
    annee = _chercher_lignes(_RE_ANNEE, lignes)
    kilometrage = _chercher_lignes(_RE_KM, lignes)
    lot = _RE_LOT.search(texte_pied)
    identifiant = _RE_ID_FICHE.search(url)

    return {
        "marque": marque,
        "modele": modele,
        "version": _texte(carte, SELECTEURS["version"]),
        "prix": prix,
        "type_prix": type_prix,
        "kilometrage": _nombre(kilometrage.group(1)) if kilometrage else None,
        "annee": int(annee.group(1)) if annee else None,
        "lieu": _texte(pied, SELECTEURS["lieu"]) if pied else "",
        "date_vente": _texte(pied, SELECTEURS["date_vente"]) if pied else "",
        "lot": lot.group(1) if lot else "",
        "url": url,
        "id": identifiant.group(1) if identifiant else "",
    }


def parser_page(html):
    """Rend la liste des véhicules présents sur une page de résultats."""
    soup = BeautifulSoup(html, "html.parser")
    cartes = [c for c in soup.select(SELECTEURS["carte"]) if _est_carte_vehicule(c)]

    vehicules = []
    vus = set()
    for carte in cartes:
        vehicule = parser_carte(carte)
        # Une même fiche peut apparaître deux fois (vue mobile + vue bureau).
        cle = vehicule["url"]
        if cle and cle in vus:
            continue
        vus.add(cle)
        vehicules.append(vehicule)

    return vehicules
