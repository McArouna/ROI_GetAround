"""Sélection des bonnes affaires parmi les véhicules collectés.

Couche purement métier : elle ne sait pas d'où viennent les véhicules
(scraping en direct ou fichier HTML sauvegardé) ni où partent les résultats.
"""

import re

from config import MODELES_SUIVIS, PONDERATION, TOP_N
from parsing import PRIX_MISE_A_PRIX
from ponderation import prix_reference


def identifier_modele(vehicule, modeles=MODELES_SUIVIS):
    """Rattache un véhicule à un modèle suivi, ou None s'il n'en fait pas partie."""
    marque = (vehicule.get("marque") or "").upper()
    # La version porte parfois la génération absente du titre.
    libelle = f"{vehicule.get('modele') or ''} {vehicule.get('version') or ''}".upper()

    for modele in modeles:
        if modele["marque"].upper() != marque:
            continue
        if any(re.search(motif, libelle, re.I) for motif in modele["patterns"]):
            return modele
    return None


def calculer_decote(prix, prix_moyen):
    """Écart en % sous le prix moyen. 7 600 € contre 9 500 € -> 20.0."""
    if not prix_moyen:
        return 0.0
    return round((prix_moyen - prix) / prix_moyen * 100, 1)


def _cle_de_tri(vehicule):
    """Décote décroissante, puis kilométrage croissant, puis année décroissante.

    Les valeurs manquantes sont reléguées en fin de classement plutôt que de
    faire planter la comparaison.
    """
    return (
        -vehicule["decote_pct"],
        vehicule["kilometrage"] if vehicule["kilometrage"] is not None else float("inf"),
        -(vehicule["annee"] or 0),
    )


def selectionner_affaires(vehicules, modeles=MODELES_SUIVIS, top_n=TOP_N, ponderation=PONDERATION):
    """Rend, pour chaque modèle suivi, les meilleures affaires sous le prix moyen.

    L'ordre des sections suit celui de la table de configuration.
    """
    par_modele = {modele["nom"]: [] for modele in modeles}
    total_analyses = {modele["nom"]: 0 for modele in modeles}

    for vehicule in vehicules:
        modele = identifier_modele(vehicule, modeles)
        if modele is None:
            continue

        total_analyses[modele["nom"]] += 1
        prix = vehicule.get("prix")
        if prix is None:
            continue

        # La référence est ajustée à l'âge et au kilométrage de ce véhicule :
        # c'est elle qui décide, pas la moyenne brute du modèle. Une vieille
        # Clio 4 très kilométrée sous les 9 500 € n'est pas une affaire.
        reference, detail = prix_reference(vehicule, modele, ponderation)
        if prix >= reference:
            continue

        retenu = dict(vehicule)
        retenu["prix_moyen_marche"] = modele["prix_moyen"]
        retenu["prix_reference_ajuste"] = reference
        retenu["decote_pct"] = calculer_decote(prix, reference)
        retenu["decote_brute_pct"] = calculer_decote(prix, modele["prix_moyen"])
        retenu["ponderation"] = detail
        par_modele[modele["nom"]].append(retenu)

    sections = []
    for modele in modeles:
        trouves = sorted(par_modele[modele["nom"]], key=_cle_de_tri)
        sections.append(
            {
                "modele": modele["nom"],
                "prix_moyen_marche": modele["prix_moyen"],
                "age_reference": modele.get("age_reference"),
                "nb_lots_analyses": total_analyses[modele["nom"]],
                "nb_sous_reference": len(trouves),
                "top": trouves[:top_n],
            }
        )
    return sections


def construire_resultats(
    vehicules, source, modeles=MODELES_SUIVIS, top_n=TOP_N, ponderation=PONDERATION
):
    """Assemble le document final, prêt à être sérialisé en JSON."""
    from datetime import datetime, timezone

    sections = selectionner_affaires(vehicules, modeles, top_n, ponderation)

    return {
        "genere_le": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": source,
        "nb_vehicules_collectes": len(vehicules),
        "avertissement": (
            "Les montants Alcopa sont des enchères en cours ou des mises à prix, "
            "pas des prix de vente finaux : une décote élevée sur un lot en "
            f"'{PRIX_MISE_A_PRIX}' reflète surtout une enchère qui n'a pas encore monté. "
            "Les frais de vente s'ajoutent au prix marteau et ne sont pas comptés ici."
        ),
        "methode_decote": (
            "decote_pct compare le prix au prix de référence ajusté à l'âge et au "
            "kilométrage du véhicule. decote_brute_pct le compare au prix moyen du "
            "modèle, tous millésimes confondus."
        ),
        "sections": sections,
    }
