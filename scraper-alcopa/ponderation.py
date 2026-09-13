"""Ajustement du prix de référence à l'âge et au kilométrage d'un véhicule.

Sans cet ajustement, une Clio 4 de 2013 à 175 000 km est comparée à la même
moyenne qu'une Clio 4 de 2019 à 40 000 km, et ressort en fausse bonne affaire.

Le principe : partir du prix moyen du modèle, puis le corriger deux fois.
  1. l'écart d'âge par rapport au véhicule "moyen" auquel ce prix correspond
  2. l'écart de kilométrage par rapport au kilométrage attendu pour cet âge

Les coefficients sont des ordres de grandeur du marché de l'occasion, pas des
valeurs Argus. Ils se règlent dans `config.PONDERATION`.
"""

from datetime import date

from config import PONDERATION


def _annee_reference(params):
    return params.get("annee_reference") or date.today().year


def _borner(valeur, mini, maxi):
    return max(mini, min(maxi, valeur))


def prix_reference(vehicule, modele, params=PONDERATION):
    """Prix de référence ajusté pour ce véhicule précis.

    Rend (prix_ajusté, détail). Le détail explicite chaque correction, pour que
    le rapport reste lisible et qu'un résultat surprenant puisse se vérifier.

    Sans année ni kilométrage, aucun ajustement n'est possible : on retombe sur
    le prix moyen brut plutôt que d'inventer une correction.
    """
    prix_moyen = modele["prix_moyen"]
    annee = vehicule.get("annee")
    kilometrage = vehicule.get("kilometrage")

    if not params.get("active", True) or annee is None or kilometrage is None:
        return prix_moyen, {
            "ponderation_appliquee": False,
            "motif": "données d'âge ou de kilométrage manquantes"
            if params.get("active", True)
            else "pondération désactivée",
        }

    age = max(0, _annee_reference(params) - annee)
    age_ref = modele.get("age_reference", params["age_reference_defaut"])

    # Correction d'âge : chaque année d'écart applique le taux de dépréciation.
    facteur_age = (1 - params["depreciation_annuelle"]) ** (age - age_ref)

    # Correction kilométrique : seul l'écart au kilométrage attendu compte,
    # sinon on pénaliserait deux fois l'âge du véhicule.
    km_attendu = age * params["km_par_an_reference"]
    ecart_km = kilometrage - km_attendu
    facteur_km = _borner(
        1 - (ecart_km / 1000) * params["impact_par_1000km"],
        params["facteur_km_min"],
        params["facteur_km_max"],
    )

    ajuste = _borner(
        prix_moyen * facteur_age * facteur_km,
        prix_moyen * params["plancher_pct"],
        prix_moyen * params["plafond_pct"],
    )

    return round(ajuste), {
        "ponderation_appliquee": True,
        "age": age,
        "age_reference": age_ref,
        "km_attendu": round(km_attendu),
        "ecart_km": round(ecart_km),
        "facteur_age": round(facteur_age, 3),
        "facteur_km": round(facteur_km, 3),
    }
