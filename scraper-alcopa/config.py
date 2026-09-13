"""Configuration du scraper Alcopa Auction.

C'est le seul fichier à modifier pour ajuster les modèles suivis,
les prix moyens de référence ou le rythme de scraping.
"""

# ---------------------------------------------------------------------------
# Table des prix moyens marché (€), par modèle suivi.
#
# Source : estimation à dire d'expert (Argus Occasion / La Centrale, sept. 2026),
# tous millésimes confondus. Point de départ ajustable, pas une vérité figée.
#
# `patterns` liste les libellés tels qu'ils apparaissent sur Alcopa, qui écrit
# les générations en chiffres romains ("CLIO IV" et non "Clio 4").
# ---------------------------------------------------------------------------
MODELES_SUIVIS = [
    {
        "nom": "Volkswagen Polo",
        "prix_moyen": 15400,
        "marque": "VOLKSWAGEN",
        "patterns": [r"\bPOLO\b"],
    },
    {
        "nom": "Renault Clio 4",
        "prix_moyen": 9500,
        "marque": "RENAULT",
        "patterns": [r"\bCLIO\s*(?:IV|4)\b"],
    },
    {
        "nom": "Peugeot 208",
        "prix_moyen": 11500,
        "marque": "PEUGEOT",
        "patterns": [r"\b208\b"],
    },
    {
        "nom": "Peugeot 2008",
        "prix_moyen": 13500,
        "marque": "PEUGEOT",
        "patterns": [r"\b2008\b"],
    },
    {
        "nom": "Ford Focus",
        "prix_moyen": 11000,
        "marque": "FORD",
        "patterns": [r"\bFOCUS\b"],
    },
]

# Nombre de véhicules retenus par modèle.
TOP_N = 3

# ---------------------------------------------------------------------------
# Sélecteurs CSS, relevés sur le HTML réel d'Alcopa (septembre 2026).
# À vérifier en premier si le scraper ne remonte plus rien : c'est la partie
# qui casse quand le site change de thème.
# ---------------------------------------------------------------------------
SELECTEURS = {
    "carte": "div.card",
    "titre": ".card-title a",
    "version": ".card-text p.mb-2",
    "details": ".card-text p.mb-1",
    "pied": ".card-footer",
    "lieu": 'p[title="Lieu de stockage"] strong',
    "date_vente": 'p[title="Date vente"] strong',
}

# Fragment présent dans l'URL de toutes les fiches véhicule : sert à
# distinguer une vraie carte lot d'un autre bloc `.card` de la page.
FRAGMENT_URL_FICHE = "/voiture-occasion/"

# ---------------------------------------------------------------------------
# Scraping
# ---------------------------------------------------------------------------
URL_RECHERCHE = "https://www.alcopa-auction.fr/recherche"

# Un user-agent de navigateur courant. Le site renvoie une erreur aux clients
# HTTP simples, d'où le passage par un vrai navigateur (Playwright).
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
)

# Délai entre deux pages, en secondes. Ne pas descendre sous 2 s : le but est
# de rester un visiteur poli, pas de marteler le site.
DELAI_ENTRE_PAGES = 3.0

# Garde-fou : nombre maximum de pages parcourues par run.
MAX_PAGES = 20

# Délai d'attente maximum pour le rendu d'une page, en millisecondes.
TIMEOUT_PAGE_MS = 30000

# Sélecteurs du bandeau cookies, essayés dans l'ordre.
BOUTONS_COOKIES = [
    "#didomi-notice-agree-button",
    "button#tarteaucitronPersonalize2",
    'button:has-text("Tout accepter")',
    'button:has-text("J\'accepte")',
]
