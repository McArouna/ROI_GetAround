"""Collecte des pages Alcopa via un navigateur headless.

Le site répond par une erreur aux clients HTTP simples et construit ses
résultats en JavaScript : il faut un vrai navigateur pour obtenir le HTML rendu.

Playwright n'est importé qu'à l'appel, pour que le reste du programme
(parsing, analyse, tests) fonctionne sans l'avoir installé.
"""

import logging
import time

from config import (
    BOUTONS_COOKIES,
    DELAI_ENTRE_PAGES,
    MAX_PAGES,
    TIMEOUT_PAGE_MS,
    URL_RECHERCHE,
    USER_AGENT,
)
from parsing import parser_page

logger = logging.getLogger(__name__)


def _accepter_cookies(page):
    """Ferme le bandeau cookies s'il est présent. Son absence n'est pas une erreur."""
    for selecteur in BOUTONS_COOKIES:
        try:
            bouton = page.locator(selecteur).first
            if bouton.is_visible(timeout=2000):
                bouton.click(timeout=2000)
                logger.info("Bandeau cookies accepté (%s)", selecteur)
                return
        except Exception:
            continue


def _url_page(numero):
    if numero <= 1:
        return URL_RECHERCHE
    separateur = "&" if "?" in URL_RECHERCHE else "?"
    return f"{URL_RECHERCHE}{separateur}page={numero}"


def collecter(max_pages=MAX_PAGES, headless=True):
    """Parcourt le catalogue page par page et rend la liste des véhicules.

    Une page qui échoue est journalisée puis sautée : un timeout sur la page 4
    ne doit pas faire perdre les pages 1 à 3.
    """
    from playwright.sync_api import sync_playwright

    vehicules = []
    urls_vues = set()

    with sync_playwright() as p:
        navigateur = p.chromium.launch(headless=headless)
        contexte = navigateur.new_context(user_agent=USER_AGENT, locale="fr-FR")
        page = contexte.new_page()

        try:
            for numero in range(1, max_pages + 1):
                url = _url_page(numero)
                try:
                    page.goto(url, timeout=TIMEOUT_PAGE_MS, wait_until="domcontentloaded")
                    if numero == 1:
                        _accepter_cookies(page)
                    # Laisse le rendu JS se terminer avant de lire le DOM.
                    page.wait_for_timeout(2000)
                    html = page.content()
                except Exception as erreur:
                    logger.warning("Page %s ignorée (%s)", numero, erreur)
                    continue

                lot_page = parser_page(html)
                nouveaux = [v for v in lot_page if v["url"] not in urls_vues]
                urls_vues.update(v["url"] for v in nouveaux)
                vehicules.extend(nouveaux)

                logger.info(
                    "Page %s : %s lots lus, %s nouveaux (total %s)",
                    numero,
                    len(lot_page),
                    len(nouveaux),
                    len(vehicules),
                )

                # Plus de lots, ou page entièrement déjà vue : fin du catalogue.
                if not lot_page or not nouveaux:
                    logger.info("Fin du catalogue à la page %s", numero)
                    break

                time.sleep(DELAI_ENTRE_PAGES)
        finally:
            contexte.close()
            navigateur.close()

    return vehicules


def collecter_depuis_fichier(chemin):
    """Lit une page sauvegardée depuis le navigateur. Utile hors ligne et pour tester."""
    with open(chemin, encoding="utf-8", errors="replace") as fichier:
        return parser_page(fichier.read())
