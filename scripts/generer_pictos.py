"""Recrée src/donnees/pictos.ts à partir des SVG de design/pictos/."""
import json, os, re

SOURCE = "design/pictos"
lignes = [
    "// Généré depuis design/pictos/*.svg : ne pas modifier à la main.",
    "// Pour régénérer : python scripts/generer_pictos.py",
    "",
    "export const Pictos = {",
]
for fichier in sorted(os.listdir(SOURCE)):
    svg = re.sub(r"\s*\n\s*", "", open(f"{SOURCE}/{fichier}", encoding="utf-8").read().strip())
    lignes.append(f"  {fichier[:-4]}: {json.dumps(svg, ensure_ascii=False)},")
lignes += ["} as const;", "", "export type Sport = keyof typeof Pictos;", ""]
open("src/donnees/pictos.ts", "w", encoding="utf-8").write("\n".join(lignes))
