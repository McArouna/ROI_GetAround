# Scraper de bonnes affaires — Alcopa Auction

Repère les véhicules du catalogue public Alcopa Auction dont le prix affiché est
inférieur au prix moyen du marché, et rend le Top 3 par modèle suivi.

MVP : sortie dans un fichier JSON, pas encore branché sur l'application ROI_GetAround.

## Installation

```bash
cd scraper-alcopa
pip install -r requirements.txt
playwright install chromium
```

## Utilisation

```bash
# Scraping en direct du catalogue
python main.py

# Analyser une page sauvegardée depuis le navigateur (aucun accès réseau)
python main.py --html ma_page.html

# Run court, avec le navigateur visible pour observer ce qui se passe
python main.py --max-pages 3 --visible
```

Les résultats sont écrits dans `resultats_scraping.json` (modifiable avec `--sortie`)
et résumés en console.

Un exemple de sortie est fourni : [`exemple_resultats.json`](exemple_resultats.json),
généré depuis la fixture de test.

## Ajuster les prix moyens

**Tout se passe dans [`config.py`](config.py)**, dans la table `MODELES_SUIVIS` en tête
de fichier :

```python
{
    "nom": "Renault Clio 4",
    "prix_moyen": 9500,        # <- le montant à ajuster
    "marque": "RENAULT",
    "patterns": [r"\bCLIO\s*(?:IV|4)\b"],
},
```

Pour suivre un modèle supplémentaire, ajoutez une entrée sur ce format. `patterns`
doit correspondre au libellé **tel qu'Alcopa l'écrit** : le site utilise les chiffres
romains (`CLIO IV`, `MEGANE IV`), d'où le motif qui accepte `IV` comme `4`.

L'ordre de la table détermine l'ordre des sections dans le rapport.

## Deux points à connaître avant d'exploiter les résultats

**1. Les prix affichés ne sont pas des prix de vente.** Alcopa affiche soit
`Enchère courante`, soit `Mise à prix` quand aucune enchère n'a encore été portée.
Une décote de 50 % sur une mise à prix ne signifie pas une bonne affaire : elle
signifie surtout que l'enchère n'a pas encore monté. Le champ `type_prix` de chaque
résultat indique lequel des deux vous regardez — c'est la donnée la plus importante
du rapport. Les frais de vente ("Frais en sus") s'ajoutent par ailleurs au prix
marteau et ne sont pas inclus ici.

**2. Le prix moyen de référence est tous millésimes confondus.** Comparer une Clio 4
de 2013 à 175 000 km à une moyenne qui inclut des modèles de 2019 surestime
mécaniquement la décote. Le kilométrage et l'année figurent dans chaque résultat
pour permettre cette relecture. Une pondération par âge/kilométrage serait
l'amélioration la plus utile pour une v2.

## Structure

| Fichier | Rôle |
|---|---|
| `config.py` | Table des prix moyens, sélecteurs CSS, rythme de scraping |
| `parsing.py` | HTML → véhicules. Ne connaît pas le réseau, testable hors ligne |
| `analyse.py` | Filtrage sous le prix moyen, classement, Top 3 |
| `scraping.py` | Navigation Playwright, pagination, gestion des erreurs |
| `main.py` | Ligne de commande, écriture JSON, résumé console |

La collecte et la génération des résultats sont volontairement séparées : changer le
mode de sortie (API, base de données, lecture directe par l'app) ne demande de
toucher qu'à `main.py`.

## Tests

```bash
python -m unittest discover -s tests -v
```

Les tests s'appuient sur `tests/fixture_cartes.html`, dont la structure est calquée
sur une vraie page de salle de vente. Ils couvrent le parsing (dont le piège de
l'année et du kilométrage qui fusionnent si l'on aplatit les `<br>`), la distinction
enchère / mise à prix, la reconnaissance des modèles (`208` ne doit pas matcher
`2008`, `CLIO III` ne doit pas passer pour une Clio 4) et les trois critères de
classement.

## Si le scraper ne remonte plus rien

C'est presque toujours qu'Alcopa a changé son thème et donc ses classes CSS.
Le dictionnaire `SELECTEURS` de `config.py` regroupe tous les sélecteurs à ce seul
endroit. Pour les remettre à jour : ouvrez une page de résultats dans le navigateur,
enregistrez-la (`Ctrl+S`), puis comparez sa structure aux sélecteurs du fichier.
`python main.py --html page_sauvegardee.html` permet de valider la correction sans
retourner sur le site.

## Limites de cette version

- Pas d'authentification : uniquement le catalogue public, donc ni rapport
  d'inspection ni contrôle technique
- Aucune fonction d'enchère ou d'achat
- Alcopa uniquement
- Le site limite l'accès automatisé : le scraper temporise entre les pages
  (`DELAI_ENTRE_PAGES`, 3 s par défaut). Ne le baissez pas — le risque concret est
  un blocage d'IP. Vérifiez également les conditions d'utilisation du site avant
  tout usage régulier.
