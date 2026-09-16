"""Tests hors-ligne du parseur : python3 powerbody/test_parsing.py"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))

from parsing import derniere_page, est_connecte, extraire_produits, parse_prix
from tarifs import calculer_ligne

FIXTURES = pathlib.Path(__file__).parent / "fixtures"
echecs = []


def verifie(condition, message):
    if condition:
        print(f"  ok   {message}")
    else:
        print(f"  ECHEC {message}")
        echecs.append(message)


def lire(nom):
    return (FIXTURES / nom).read_text(encoding="utf-8")


print("parse_prix")
for texte, attendu in [
    ("24,90 €", 24.90),
    ("€24.90", 24.90),
    ("1 234,56 €", 1234.56),
    ("1.234,56 EUR", 1234.56),
    ("&nbsp;9,99 €", 9.99),
    ("1.234 €", 1234.0),
    ("Prix : 18,45 € TTC", 18.45),
    ("Livraison gratuite", None),
    ("", None),
]:
    verifie(parse_prix(texte) == attendu, f"{texte!r} -> {attendu}")

print("\nMagento 1 (grille .products-grid)")
produits = extraire_produits(lire("magento1.html"), "https://fr.powerbody.eu/")
verifie(len(produits) == 3, f"3 produits trouvés (obtenu {len(produits)})")
if produits:
    p = produits[0]
    verifie(p.nom == "NOW Foods Vitamin C-1000 250 caps", f"nom = {p.nom!r}")
    verifie(p.prix_eur == 18.45, f"prix promo retenu = {p.prix_eur} (et non l'ancien 24.90)")
    verifie(p.prix_barre_eur == 24.90, f"prix barré = {p.prix_barre_eur}")
    verifie(p.dispo == "En stock", f"dispo = {p.dispo!r}")
    verifie(p.sku == "1234", f"sku déduit de l'url = {p.sku!r}")
    verifie(p.url.startswith("https://fr.powerbody.eu/now-foods-vitamin"), "url absolue")
    verifie(produits[1].dispo == "Rupture", "rupture de stock détectée")
    verifie(produits[2].prix_eur == 1234.50, f"prix à 4 chiffres = {produits[2].prix_eur}")
verifie(derniere_page(lire("magento1.html")) == 3, "pagination : 3 pages")
verifie(est_connecte(lire("magento1.html")) is True, "session connectée détectée")
verifie(est_connecte("<html><a href='/login'>Connexion</a></html>") is False, "session anonyme détectée")

print("\nMagento 2 (ol.products.list)")
produits = extraire_produits(lire("magento2.html"), "https://fr.powerbody.eu/")
verifie(len(produits) == 2, f"2 produits trouvés (obtenu {len(produits)})")
if len(produits) == 2:
    verifie(produits[0].prix_eur == 11.40, f"prix final = {produits[0].prix_eur} (et non 15.20)")
    verifie(produits[0].prix_barre_eur == 15.20, f"prix barré = {produits[0].prix_barre_eur}")
    verifie(produits[1].prix_eur == 8.75, f"prix via data-price-amount = {produits[1].prix_eur}")
    verifie(
        produits[0].nom == "NOW Foods Magnesium Caps 400 mg",
        "le DOM prime sur le JSON-LD (prix du compte connecté)",
    )

print("\nGabarit inconnu (heuristique)")
produits = extraire_produits(lire("inconnu.html"), "https://fr.powerbody.eu/")
verifie(len(produits) == 2, f"2 produits trouvés (obtenu {len(produits)})")
if len(produits) == 2:
    verifie(produits[0].prix_eur == 32.90, f"prix = {produits[0].prix_eur}")
    verifie("Whey" in produits[0].nom, f"nom = {produits[0].nom!r}")

print("\nStratégie forcée : json-ld")
produits = extraire_produits(lire("magento2.html"), "https://fr.powerbody.eu/", strategie="json-ld")
verifie(len(produits) == 1 and produits[0].sku == "NOW-MAG", "produit json-ld lu")

print("\nCalcul des tarifs")
ligne = calculer_ligne(10.0, taux=280, mode="da", marge=500, frais_da=0, arrondi=0)
verifie(ligne["achat_da"] == 2800, f"10 € x 280 = {ligne['achat_da']} DA")
verifie(ligne["vente_da"] == 3300, f"vente = achat + marge = {ligne['vente_da']} DA")
verifie(abs(ligne["marge_pct"] - 17.857) < 0.01, f"marge % = {ligne['marge_pct']:.3f}")

ligne = calculer_ligne(10.0, taux=280, mode="pct", marge=30, frais_da=0, arrondi=0)
verifie(ligne["vente_da"] == 3640, f"+30 % = {ligne['vente_da']} DA")
verifie(ligne["marge_da"] == 840, f"marge = {ligne['marge_da']} DA")

ligne = calculer_ligne(10.0, taux=280, mode="da", marge=500, frais_da=200, arrondi=100)
verifie(ligne["revient_da"] == 3000, f"revient avec frais = {ligne['revient_da']} DA")
verifie(ligne["vente_da"] == 3500, f"arrondi à 100 DA = {ligne['vente_da']} DA")

ligne = calculer_ligne(10.0, taux=280, mode="da", marge=530, frais_da=0, arrondi=50)
verifie(ligne["vente_da"] == 3350, f"3330 arrondi au 50 supérieur = {ligne['vente_da']} DA")
verifie(ligne["marge_da"] == 550, "la marge réelle suit l'arrondi")

print()
if echecs:
    print(f"{len(echecs)} test(s) en échec")
    sys.exit(1)
print("Tous les tests passent.")
