"""Tests de la chaîne parsing -> analyse, sur une fixture calquée sur le HTML réel."""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analyse import calculer_decote, identifier_modele, selectionner_affaires
from config import PONDERATION
from parsing import PRIX_ENCHERE, PRIX_MISE_A_PRIX, parser_page
from ponderation import prix_reference

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


SANS_PONDERATION = dict(PONDERATION, active=False)


def sections_par_modele(ponderation=PONDERATION):
    return {s["modele"]: s for s in selectionner_affaires(charger(), ponderation=ponderation)}


class TestSelection(unittest.TestCase):
    def setUp(self):
        self.sections = sections_par_modele()

    def test_ordre_des_sections_suit_la_configuration(self):
        noms = [s["modele"] for s in selectionner_affaires(charger())]
        self.assertEqual(
            noms,
            ["Volkswagen Polo", "Renault Clio 4", "Peugeot 208", "Peugeot 2008", "Ford Focus"],
        )

    def test_top_plafonne_a_trois(self):
        clio = self.sections["Renault Clio 4"]
        self.assertEqual(clio["nb_lots_analyses"], 4)
        self.assertEqual(clio["nb_sous_reference"], 4)
        self.assertEqual(len(clio["top"]), 3)

    def test_classement_par_decote_puis_kilometrage(self):
        """Sans pondération, deux lots au même prix se départagent au kilométrage."""
        top = sections_par_modele(SANS_PONDERATION)["Renault Clio 4"]["top"]
        # 4 500 € = plus forte décote ; puis deux lots à 7 200 €, départagés au km.
        self.assertEqual([v["lot"] for v in top], ["503", "502", "501"])
        self.assertEqual(top[1]["kilometrage"], 62000)
        self.assertEqual(top[2]["kilometrage"], 98000)

    def test_lot_le_moins_decote_exclu_du_top(self):
        top = self.sections["Renault Clio 4"]["top"]
        self.assertNotIn("504", [v["lot"] for v in top])

    def test_section_avec_un_seul_resultat(self):
        p2008 = self.sections["Peugeot 2008"]
        self.assertEqual(len(p2008["top"]), 1)
        self.assertEqual(p2008["top"][0]["prix"], 9900)

    def test_section_sans_aucun_lot(self):
        polo = self.sections["Volkswagen Polo"]
        self.assertEqual(polo["nb_lots_analyses"], 0)
        self.assertEqual(polo["top"], [])

    def test_decote_brute_conservee_pour_comparaison(self):
        # 4 500 € contre une moyenne brute de 9 500 € -> 52,6 %
        lot = self.sections["Renault Clio 4"]["top"][0]
        self.assertEqual(lot["decote_brute_pct"], 52.6)


class TestEffetPonderation(unittest.TestCase):
    """Les deux corrections que la pondération doit apporter, dans les deux sens."""

    def test_vieux_vehicule_tres_kilometre_voit_sa_decote_degonflee(self):
        # Lot 503 : Clio 4 de 2013 à 175 000 km. Sous la moyenne brute elle
        # paraît exceptionnelle ; ramenée à son âge et son kilométrage, beaucoup moins.
        lot = next(
            v for v in sections_par_modele()["Renault Clio 4"]["top"] if v["lot"] == "503"
        )
        self.assertEqual(lot["decote_brute_pct"], 52.6)
        self.assertLess(lot["decote_pct"], 25.0)
        self.assertLess(lot["prix_reference_ajuste"], lot["prix_moyen_marche"])

    def test_vehicule_recent_au_dessus_de_la_moyenne_brute_est_retenu(self):
        # Lot 506 : 208 de 2021 à 45 000 km, 12 800 € donc au-dessus des 11 500 €
        # de moyenne. La comparaison brute la rejette ; à millésime comparable
        # c'est pourtant une affaire.
        avec = sections_par_modele()["Peugeot 208"]
        sans = sections_par_modele(SANS_PONDERATION)["Peugeot 208"]

        self.assertEqual(sans["nb_sous_reference"], 0)
        self.assertEqual(sans["top"], [])

        self.assertEqual(avec["nb_sous_reference"], 1)
        self.assertEqual(avec["top"][0]["lot"], "506")
        self.assertLess(avec["top"][0]["decote_brute_pct"], 0)
        self.assertGreater(avec["top"][0]["decote_pct"], 0)

    def test_detail_de_ponderation_joint_au_resultat(self):
        lot = sections_par_modele()["Renault Clio 4"]["top"][0]
        self.assertTrue(lot["ponderation"]["ponderation_appliquee"])
        self.assertIn("facteur_age", lot["ponderation"])
        self.assertIn("km_attendu", lot["ponderation"])


class TestPrixReference(unittest.TestCase):
    CLIO = {
        "nom": "Renault Clio 4",
        "prix_moyen": 9500,
        "marque": "RENAULT",
        "patterns": [r"\bCLIO\s*(?:IV|4)\b"],
        "age_reference": 9,
    }
    # Année figée : sinon les attendus changeraient à chaque nouvel an.
    PARAMS = dict(PONDERATION, annee_reference=2026)

    def reference(self, annee, km):
        prix, _ = prix_reference({"annee": annee, "kilometrage": km}, self.CLIO, self.PARAMS)
        return prix

    def test_vehicule_a_l_age_et_au_km_de_reference_reste_proche_de_la_moyenne(self):
        # 2017 = 9 ans en 2026, soit l'âge de référence ; 117 000 km attendus.
        self.assertAlmostEqual(self.reference(2017, 117000), 9500, delta=100)

    def test_plus_le_vehicule_est_vieux_plus_la_reference_baisse(self):
        references = [self.reference(annee, 100000) for annee in (2019, 2016, 2013)]
        self.assertEqual(references, sorted(references, reverse=True))

    def test_kilometrage_eleve_baisse_la_reference(self):
        self.assertLess(self.reference(2015, 200000), self.reference(2015, 60000))

    def test_plafond_borne_les_vehicules_recents(self):
        """Extrapoler la dépréciation à rebours surestime les véhicules récents."""
        plafond = 9500 * PONDERATION["plafond_pct"]
        self.assertLessEqual(self.reference(2024, 10000), plafond)

    def test_plancher_borne_les_epaves(self):
        plancher = 9500 * PONDERATION["plancher_pct"]
        self.assertGreaterEqual(self.reference(2004, 350000), plancher)

    def test_sans_annee_ni_km_on_retombe_sur_la_moyenne_brute(self):
        prix, detail = prix_reference({"annee": None, "kilometrage": None}, self.CLIO)
        self.assertEqual(prix, 9500)
        self.assertFalse(detail["ponderation_appliquee"])

    def test_ponderation_desactivee_rend_la_moyenne_brute(self):
        prix, detail = prix_reference(
            {"annee": 2013, "kilometrage": 175000}, self.CLIO, SANS_PONDERATION
        )
        self.assertEqual(prix, 9500)
        self.assertFalse(detail["ponderation_appliquee"])


class TestDecote(unittest.TestCase):
    def test_calcul(self):
        self.assertEqual(calculer_decote(7600, 9500), 20.0)

    def test_prix_egal_a_la_moyenne(self):
        self.assertEqual(calculer_decote(9500, 9500), 0.0)

    def test_prix_moyen_absent_ne_plante_pas(self):
        self.assertEqual(calculer_decote(7600, 0), 0.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
