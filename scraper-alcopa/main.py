"""Point d'entrée du scraper de bonnes affaires Alcopa Auction.

    python main.py                          # scraping en direct
    python main.py --html page.html         # depuis une page sauvegardée
    python main.py --max-pages 5 --visible  # run court, navigateur visible
"""

import argparse
import json
import logging
import sys

from analyse import construire_resultats
from config import MODELES_SUIVIS

SORTIE_PAR_DEFAUT = "resultats_scraping.json"


def ecrire_json(resultats, chemin):
    with open(chemin, "w", encoding="utf-8") as fichier:
        json.dump(resultats, fichier, ensure_ascii=False, indent=2)


def afficher_resume(resultats):
    """Récapitulatif lisible en console, section par section."""
    print(f"\n{resultats['nb_vehicules_collectes']} véhicules collectés\n")

    for section in resultats["sections"]:
        print(f"--- {section['modele']} (moyenne marché : {section['prix_moyen_marche']} €)")
        print(
            f"    {section['nb_lots_analyses']} lot(s) de ce modèle, "
            f"{section['nb_sous_reference']} sous la référence ajustée"
        )

        if not section["top"]:
            print("    aucune affaire\n")
            continue

        for rang, vehicule in enumerate(section["top"], 1):
            print(
                f"    {rang}. {vehicule['marque']} {vehicule['modele']} — "
                f"{vehicule['prix']} € ({vehicule['type_prix']}), "
                f"décote {vehicule['decote_pct']} %"
            )
            print(
                f"       {vehicule['kilometrage']} km · {vehicule['annee']} · "
                f"{vehicule['lieu']} · vente {vehicule['date_vente']}"
            )
            print(
                f"       référence ajustée {vehicule['prix_reference_ajuste']} € "
                f"(moyenne brute {vehicule['prix_moyen_marche']} € · "
                f"décote brute {vehicule['decote_brute_pct']} %)"
            )
            print(f"       {vehicule['url']}")
        print()


def main():
    parser = argparse.ArgumentParser(description="Bonnes affaires Alcopa Auction")
    parser.add_argument("--html", help="analyser une page sauvegardée au lieu de scraper")
    parser.add_argument("--sortie", default=SORTIE_PAR_DEFAUT, help="fichier JSON de sortie")
    parser.add_argument("--max-pages", type=int, default=None, help="limite de pages à parcourir")
    parser.add_argument("--visible", action="store_true", help="afficher le navigateur")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    if args.html:
        from scraping import collecter_depuis_fichier

        vehicules = collecter_depuis_fichier(args.html)
        source = args.html
    else:
        try:
            from scraping import collecter
        except ImportError:
            print(
                "Playwright est requis pour le scraping en direct :\n"
                "    pip install -r requirements.txt\n"
                "    playwright install chromium\n"
                "Sinon, analysez une page sauvegardée avec --html page.html",
                file=sys.stderr,
            )
            return 1

        from config import MAX_PAGES

        vehicules = collecter(
            max_pages=args.max_pages or MAX_PAGES,
            headless=not args.visible,
        )
        source = "alcopa-auction.fr (direct)"

    resultats = construire_resultats(vehicules, source, MODELES_SUIVIS)
    ecrire_json(resultats, args.sortie)
    afficher_resume(resultats)
    print(f"Résultats écrits dans {args.sortie}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
