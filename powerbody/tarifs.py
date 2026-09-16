"""Conversion euro -> dinar et calcul du prix de vente selon la marge voulue.

Les mêmes formules sont reprises à l'identique dans tarificateur.html.
"""

from __future__ import annotations

import math

TAUX_PARALLELE = 280.0  # 1 EUR = 280 DA (marché parallèle)


def arrondir_sup(valeur: float, pas: float) -> float:
    """Arrondit au multiple supérieur (500 DA au pas de 100 -> 500 ; 505 -> 600)."""
    if not pas or pas <= 0:
        return round(valeur, 2)
    return math.ceil(valeur / pas) * pas


def calculer_ligne(
    prix_eur: float | None,
    taux: float = TAUX_PARALLELE,
    mode: str = "da",
    marge: float = 0.0,
    frais_da: float = 0.0,
    arrondi: float = 0.0,
) -> dict:
    """Rend le détail tarifaire d'un produit.

    mode : "da"  -> marge fixe en dinars par unité
           "pct" -> marge en pourcentage du prix de revient
           "eur" -> marge fixe en euros, convertie au même taux
    """
    if prix_eur is None:
        return {}
    achat_da = round(prix_eur * taux, 2)
    revient_da = round(achat_da + frais_da, 2)

    if mode == "pct":
        vente_brute = revient_da * (1 + marge / 100.0)
    elif mode == "eur":
        vente_brute = revient_da + marge * taux
    else:
        vente_brute = revient_da + marge

    vente_da = round(arrondir_sup(vente_brute, arrondi), 2)
    marge_da = round(vente_da - revient_da, 2)
    return {
        "prix_eur": round(prix_eur, 2),
        "achat_da": achat_da,
        "frais_da": round(frais_da, 2),
        "revient_da": revient_da,
        "vente_da": vente_da,
        "vente_eur": round(vente_da / taux, 2) if taux else 0.0,
        "marge_da": marge_da,
        "marge_eur": round(marge_da / taux, 2) if taux else 0.0,
        "marge_pct": round(marge_da / revient_da * 100, 4) if revient_da else 0.0,
        "marge_sur_vente_pct": round(marge_da / vente_da * 100, 4) if vente_da else 0.0,
    }
