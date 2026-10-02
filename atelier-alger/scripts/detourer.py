#!/usr/bin/env python3
"""
Détourage des photos produit — étape 1 du pipeline d'images.

    npm run detourer              # toutes les photos pas encore détourées
    npm run detourer -- --force   # refait tout
    npm run detourer -- tasse-tanit

Entrée  : sources/<identifiant>.(jpg|jpeg|png|webp)   — photo brute
Sortie  : sources/detoures/<identifiant>.png          — fond transparent

Le détourage utilise le modèle U²-Net (paquet « rembg »). Un émail blanc sur
fond crème ne se distingue pas par la couleur : aucun seuillage ne sépare les
deux de façon fiable, d'où le passage par un modèle de segmentation.

Installation (une seule fois, ~200 Mo de modèle téléchargé au premier appel) :

    python3 -m pip install rembg onnxruntime pillow

Cette étape n'est nécessaire QUE pour une nouvelle photo. Les PNG détourés sont
versionnés : `npm run images` suffit ensuite, sans Python.

Les photos d'ambiance (scènes listées dans SCENES) ne sont pas détourées.
Si rembg n'est pas installé, un détourage à la main (Photoshop, Photopea,
remove.bg…) déposé dans sources/detoures/<identifiant>.png fait le même office.
"""

import sys
from pathlib import Path

SOURCES = Path("sources")
SORTIE = SOURCES / "detoures"
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
SCENES = {"hero-nature-morte", "atelier-mains", "atelier-sechage", "sortie-de-four"}


def main() -> int:
    arguments = sys.argv[1:]
    force = "--force" in arguments
    demandes = {a for a in arguments if not a.startswith("-")}

    if not SOURCES.is_dir():
        print(f"Dossier « {SOURCES}/ » absent : y déposer les photos brutes.", file=sys.stderr)
        return 1

    fichiers = sorted(
        f
        for f in SOURCES.iterdir()
        if f.is_file()
        and f.suffix.lower() in EXTENSIONS
        and f.stem not in SCENES
        and (not demandes or f.stem in demandes)
    )
    if not fichiers:
        print("Rien à détourer.")
        return 0

    a_faire = [f for f in fichiers if force or not (SORTIE / f"{f.stem}.png").exists()]
    if not a_faire:
        print(f"{len(fichiers)} photo(s) déjà détourée(s). « --force » pour refaire.")
        return 0

    try:
        from PIL import Image
        from rembg import new_session, remove
    except ImportError:
        print(
            "rembg est introuvable. Installer :\n"
            "    python3 -m pip install rembg onnxruntime pillow\n"
            "ou déposer les PNG détourés à la main dans sources/detoures/.",
            file=sys.stderr,
        )
        return 1

    SORTIE.mkdir(parents=True, exist_ok=True)
    session = new_session("u2net")

    for fichier in a_faire:
        image = Image.open(fichier)
        # alpha_matting : bord plus fin sur les anses, les becs et les bouchons.
        resultat = remove(
            image,
            session=session,
            alpha_matting=True,
            alpha_matting_foreground_threshold=250,
            alpha_matting_background_threshold=15,
            alpha_matting_erode_size=4,
        )
        destination = SORTIE / f"{fichier.stem}.png"
        resultat.save(destination)
        print(f"✓ {fichier.stem} — détouré → {destination}")

    print("\nÉtape suivante : npm run images")
    return 0


if __name__ == "__main__":
    sys.exit(main())
