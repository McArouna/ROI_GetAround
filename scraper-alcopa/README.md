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

**2. La décote est calculée contre une référence ajustée, pas contre la moyenne brute.**
Voir la section suivante : c'est ce qui distingue une vraie affaire d'un véhicule
simplement vieux.

## La pondération âge / kilométrage

Un prix moyen "tous millésimes" compare une Clio 4 de 2013 à 175 000 km et une de
2019 à 40 000 km à la même référence. Le scraper corrige donc le prix de référence
pour chaque véhicule, en deux temps :

1. **l'âge** — chaque année d'écart avec l'âge de référence du modèle applique le
   taux de dépréciation annuel ;
2. **le kilométrage** — seul l'écart au kilométrage *attendu pour cet âge*
   (13 000 km/an par défaut) compte, sinon l'âge serait pénalisé deux fois.

Le résultat est borné par un plancher et un plafond, tous deux exprimés en part du
prix moyen. Le plafond n'est pas cosmétique : appliquer un taux de dépréciation
constant à rebours surestime les véhicules récents. Sans lui, une Clio 4 de 2019 peu
kilométrée obtenait une référence de 14 700 € — plus qu'une Polo moyenne — et tout
lot en dessous serait passé pour une affaire.

La correction joue **dans les deux sens**, et c'est là son intérêt :

| Lot | Prix | Décote brute | Décote ajustée | Lecture |
|---|---|---|---|---|
| Clio 4 · 2013 · 175 000 km | 4 500 € | 52,6 % | **19,1 %** | fausse affaire dégonflée |
| 208 · 2021 · 45 000 km | 12 800 € | **−11,3 %** | **9,3 %** | affaire que la moyenne brute ratait |

Le second cas est le plus utile : ce lot est *au-dessus* des 11 500 € de moyenne
tous millésimes, donc invisible pour une comparaison brute — alors qu'à millésime
comparable c'est une bonne affaire.

Chaque résultat conserve les deux lectures (`decote_pct` ajustée, `decote_brute_pct`)
ainsi que le détail du calcul dans `ponderation`, pour qu'un classement surprenant
puisse se vérifier.

Les coefficients se règlent dans `PONDERATION` (`config.py`). Ce sont des ordres de
grandeur du marché de l'occasion, pas des valeurs Argus : à affiner à l'usage.
`"active": False` revient à la comparaison au prix moyen brut.

`age_reference` se règle par modèle dans `MODELES_SUIVIS`, car il dépend de la
génération : une Clio 4 (produite jusqu'en 2019) a un parc bien plus vieux qu'une
Polo encore en production.

## Structure

| Fichier | Rôle |
|---|---|
| `config.py` | Table des prix moyens, coefficients de pondération, sélecteurs CSS |
| `parsing.py` | HTML → véhicules. Ne connaît pas le réseau, testable hors ligne |
| `ponderation.py` | Prix de référence ajusté à l'âge et au kilométrage |
| `analyse.py` | Filtrage sous la référence ajustée, classement, Top 3 |
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
`2008`, `CLIO III` ne doit pas passer pour une Clio 4), les trois critères de
classement, et les deux effets de la pondération décrits plus haut.

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
