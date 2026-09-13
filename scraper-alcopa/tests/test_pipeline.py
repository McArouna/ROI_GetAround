"""Tests de la chaîne parsing -> analyse, sur une fixture calquée sur le HTML réel."""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analyse import calculer_decote, identifier_modele, selectionner_affaires
from parsing import PRIX_ENCHERE, PRIX_MISE_A_PRIX, parser_page

FIXTURE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixture_cartes.html")


def charger():
    with open(FIXTURE, encoding="utf-8") as fichier:
        return parser_page(fichier.read())


class TestParsing(unittest.TestCase):
    def setUp(self):
        self.vehicules = charger()

    def test_toutes_les_cartes_sont_lues(self):
        self.assertEqual(len(self.vehicules), 8)

    def test_champs_du_premier_lot(self):
        v = self.vehicules[0]
        self.assertEqual(v["marque"], "RENAULT")
        self.assertEqual(v["modele"], "CLIO IV")
        self.assertEqual(v["prix"], 7200)
        self.assertEqual(v["type_prix"], PRIX_ENCHERE)
        self.assertEqual(v["annee"], 2015)
        self.assertEqual(v["lieu"], "Beauvais")
        self.assertEqual(v["date_vente"], "14/09/2026")
        self.assertEqual(v["lot"], "501")
        self.assertEqual(v["id"], "1200001")

    def test_annee_et_kilometrage_ne_se_melangent_pas(self):
        """Année et km sont deux lignes voisines : aplaties, elles fusionnent."""
        v = self.vehicules[0]
        self.assertEqual(v["annee"], 2015)
        self.assertEqual(v["kilometrage"], 98000)

    def test_mise_a_prix_distinguee_de_l_enchere(self):
        mise = next(v for v in self.vehicules if v["lot"] == "503")
        self.assertEqual(mise["type_prix"], PRIX_MISE_A_PRIX)
        self.assertEqual(mise["prix"], 4500)

    def test_aucun_champ_essentiel_vide(self):
        for v in self.vehicules:
            for champ in ("marque", "modele", "prix", "kilometrage", "annee", "url"):
                self.assertIsNotNone(v[champ], f"{champ} manquant sur le lot {v['lot']}")


class TestIdentificationModele(unittest.TestCase):
    def test_clio_4_reconnue_en_chiffres_romains(self):
        modele = identifier_modele({"marque": "RENAULT", "modele": "CLIO IV", "version": ""})
        self.assertEqual(modele["nom"], "Renault Clio 4")

    def test_clio_4_reconnue_depuis_la_version(self):
        modele = identifier_modele(
            {"marque": "RENAULT", "modele": "CLIO", "version": "CLIO IV DCI 90"}
        )
        self.assertEqual(modele["nom"], "Renault Clio 4")

    def test_autres_generations_de_clio_ignorees(self):
        for generation in ("CLIO III", "CLIO V"):
            self.assertIsNone(
                identifier_modele({"marque": "RENAULT", "modele": generation, "version": ""}),
                f"{generation} ne doit pas être suivie",
            )

    def test_208_et_2008_ne_se_confondent_pas(self):
        p208 = identifier_modele({"marque": "PEUGEOT", "modele": "208", "version": "208 PURETECH"})
        p2008 = identifier_modele({"marque": "PEUGEOT", "modele": "2008", "version": "2008 BLUEHDI"})
        self.assertEqual(p208["nom"], "Peugeot 208")
        self.assertEqual(p2008["nom"], "Peugeot 2008")

    def test_marque_suivie_mais_modele_hors_table(self):
        self.assertIsNone(identifier_modele({"marque": "FORD", "modele": "PUMA", "version": ""}))


class TestSelection(unittest.TestCase):
    def setUp(self):
        self.sections = {s["modele"]: s for s in selectionner_affaires(charger())}

    def test_ordre_des_sections_suit_la_configuration(self):
        noms = [s["modele"] for s in selectionner_affaires(charger())]
        self.assertEqual(
            noms,
            ["Volkswagen Polo", "Renault Clio 4", "Peugeot 208", "Peugeot 2008", "Ford Focus"],
        )

    def test_top_plafonne_a_trois(self):
        clio = self.sections["Renault Clio 4"]
        self.assertEqual(clio["nb_lots_analyses"], 4)
        self.assertEqual(clio["nb_sous_prix_moyen"], 4)
        self.assertEqual(len(clio["top"]), 3)

    def test_classement_par_decote_puis_kilometrage(self):
        top = self.sections["Renault Clio 4"]["top"]
        # 4 500 € = plus forte décote ; puis deux lots à 7 200 €, départagés au km.
        self.assertEqual([v["lot"] for v in top], ["503", "502", "501"])
        self.assertEqual(top[1]["kilometrage"], 62000)
        self.assertEqual(top[2]["kilometrage"], 98000)

    def test_lot_le_moins_decote_exclu_du_top(self):
        top = self.sections["Renault Clio 4"]["top"]
        self.assertNotIn("504", [v["lot"] for v in top])

    def test_vehicule_au_dessus_du_prix_moyen_filtre(self):
        p208 = self.sections["Peugeot 208"]
        self.assertEqual(p208["nb_lots_analyses"], 1)
        self.assertEqual(p208["nb_sous_prix_moyen"], 0)
        self.assertEqual(p208["top"], [])

    def test_section_avec_un_seul_resultat(self):
        p2008 = self.sections["Peugeot 2008"]
        self.assertEqual(len(p2008["top"]), 1)
        self.assertEqual(p2008["top"][0]["prix"], 9900)

    def test_section_sans_aucun_lot(self):
        polo = self.sections["Volkswagen Polo"]
        self.assertEqual(polo["nb_lots_analyses"], 0)
        self.assertEqual(polo["top"], [])

    def test_decote_calculee(self):
        # 4 500 € contre une moyenne de 9 500 € -> 52,6 %
        self.assertEqual(self.sections["Renault Clio 4"]["top"][0]["decote_pct"], 52.6)


class TestDecote(unittest.TestCase):
    def test_calcul(self):
        self.assertEqual(calculer_decote(7600, 9500), 20.0)

    def test_prix_egal_a_la_moyenne(self):
        self.assertEqual(calculer_decote(9500, 9500), 0.0)

    def test_prix_moyen_absent_ne_plante_pas(self):
        self.assertEqual(calculer_decote(7600, 0), 0.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
