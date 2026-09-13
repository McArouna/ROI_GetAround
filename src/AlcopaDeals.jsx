import React, { useState } from "react";
import { Gavel, MapPin, Calendar, ExternalLink, AlertTriangle, Table } from "lucide-react";

import donnees from "./data/alcopa.json";

const eur = (n) =>
  n == null ? "—" : n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";

const km = (n) => (n == null ? "—" : n.toLocaleString("fr-FR") + " km");

const LIBELLE_PRIX = {
  enchere_courante: "Enchère courante",
  mise_a_prix: "Mise à prix",
};

// Au-delà de 30 % l'affaire mérite un coup d'œil, en dessous de 15 % elle est
// dans le bruit des estimations de prix moyen.
function niveauDecote(pct) {
  if (pct >= 30) return "fort";
  if (pct >= 15) return "moyen";
  return "faible";
}

function DealCard({ vehicule, rang }) {
  const estMiseAPrix = vehicule.type_prix === "mise_a_prix";

  return (
    <div className="deal">
      <div className="deal-rang">{rang}</div>

      <div className="deal-corps">
        <div className="deal-titre">
          {vehicule.marque} {vehicule.modele}
        </div>
        <div className="deal-version">{vehicule.version}</div>

        <div className="deal-specs">
          <span>{km(vehicule.kilometrage)}</span>
          <span>{vehicule.annee}</span>
          <span>
            <MapPin size={11} /> {vehicule.lieu}
          </span>
          <span>
            <Calendar size={11} /> {vehicule.date_vente}
          </span>
          {vehicule.lot && <span>Lot {vehicule.lot}</span>}
        </div>

        <a className="deal-lien" href={vehicule.url} target="_blank" rel="noreferrer">
          Voir la fiche <ExternalLink size={11} />
        </a>
      </div>

      <div className="deal-chiffres">
        <div className="deal-prix">{eur(vehicule.prix)}</div>
        <div className={`deal-badge ${estMiseAPrix ? "badge-alerte" : ""}`}>
          {LIBELLE_PRIX[vehicule.type_prix] || vehicule.type_prix}
        </div>

        <div className={`deal-decote ${niveauDecote(vehicule.decote_pct)}`}>
          −{vehicule.decote_pct} %
        </div>
        <div className="deal-ref">
          vs {eur(vehicule.prix_reference_ajuste)} ajusté
        </div>
        <div className="deal-ref-brute">
          brute : −{vehicule.decote_brute_pct} % vs {eur(vehicule.prix_moyen_marche)}
        </div>
      </div>
    </div>
  );
}

function TableauBrut({ vehicules }) {
  return (
    <div className="brut-scroll">
      <table className="brut">
        <thead>
          <tr>
            <th>Lot</th>
            <th>Véhicule</th>
            <th className="num">Prix</th>
            <th>Type</th>
            <th className="num">Km</th>
            <th className="num">Année</th>
            <th>Vente</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {vehicules.map((v) => (
            <tr key={v.id || v.url}>
              <td className="mono-cell">{v.lot || "—"}</td>
              <td>
                <div className="brut-titre">
                  {v.marque} {v.modele}
                </div>
                <div className="brut-version">{v.version}</div>
              </td>
              <td className="num mono-cell">{eur(v.prix)}</td>
              <td>
                <span
                  className={`brut-type ${v.type_prix === "mise_a_prix" ? "badge-alerte" : ""}`}
                >
                  {LIBELLE_PRIX[v.type_prix] || "—"}
                </span>
              </td>
              <td className="num mono-cell">{km(v.kilometrage)}</td>
              <td className="num mono-cell">{v.annee ?? "—"}</td>
              <td className="mono-cell">{v.date_vente}</td>
              <td>
                <a href={v.url} target="_blank" rel="noreferrer" className="brut-lien">
                  <ExternalLink size={12} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AlcopaDeals() {
  const [vueBrute, setVueBrute] = useState(false);

  const sectionsAvecAffaires = donnees.sections.filter((s) => s.top.length > 0);
  const sectionsVides = donnees.sections.filter((s) => s.top.length === 0);
  const totalAffaires = donnees.sections.reduce((n, s) => n + s.top.length, 0);

  return (
    <div className="alcopa">
      <style>{`
        .alcopa-meta {
          display: flex; flex-wrap: wrap; gap: 10px;
          margin-bottom: 14px;
        }
        .meta-tuile {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 14px;
          flex: 1 1 150px;
        }
        .meta-label { font-size: 11px; color: var(--muted); margin-bottom: 3px; }
        .meta-valeur {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 17px; font-weight: 600;
        }
        .meta-valeur.petit { font-size: 12.5px; font-weight: 500; line-height: 1.35; }

        .alerte {
          display: flex; gap: 9px; align-items: flex-start;
          background: rgba(192, 86, 74, 0.09);
          border: 1px solid rgba(192, 86, 74, 0.4);
          border-radius: 10px;
          padding: 11px 13px;
          margin-bottom: 18px;
          font-size: 12.5px;
          line-height: 1.5;
          color: #E4B5AE;
        }
        .alerte svg { flex-shrink: 0; margin-top: 1px; color: var(--red); }

        .bascule {
          display: flex; gap: 6px; margin-bottom: 16px;
        }
        .bascule button {
          background: var(--panel);
          border: 1px solid var(--border);
          color: var(--muted);
          border-radius: 8px;
          padding: 7px 13px;
          font-family: inherit;
          font-size: 12.5px;
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
        }
        .bascule button.actif {
          color: var(--bg);
          background: var(--amber);
          border-color: var(--amber);
          font-weight: 600;
        }

        .sect { margin-bottom: 22px; }
        .sect-tete {
          display: flex; align-items: baseline; justify-content: space-between;
          flex-wrap: wrap; gap: 6px;
          margin-bottom: 10px;
          padding-bottom: 7px;
          border-bottom: 1px solid var(--border);
        }
        .sect-nom { font-size: 14px; font-weight: 600; color: var(--amber); }
        .sect-info { font-size: 11.5px; color: var(--muted); }

        .deal {
          display: flex; gap: 14px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 13px;
          margin-bottom: 9px;
        }
        .deal-rang {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px; font-weight: 600;
          color: var(--muted);
          width: 18px; flex-shrink: 0;
        }
        .deal-corps { flex: 1; min-width: 0; }
        .deal-titre { font-size: 13.5px; font-weight: 600; }
        .deal-version {
          font-size: 11.5px; color: var(--muted);
          margin-top: 1px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .deal-specs {
          display: flex; flex-wrap: wrap; gap: 10px;
          margin-top: 7px;
          font-size: 11.5px; color: var(--muted);
        }
        .deal-specs span { display: inline-flex; align-items: center; gap: 3px; }
        .deal-lien {
          display: inline-flex; align-items: center; gap: 4px;
          margin-top: 8px;
          font-size: 11.5px;
          color: var(--amber);
          text-decoration: none;
        }
        .deal-lien:hover { text-decoration: underline; }

        .deal-chiffres { text-align: right; flex-shrink: 0; }
        .deal-prix {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 18px; font-weight: 600;
        }
        .deal-badge {
          display: inline-block;
          font-size: 10px;
          color: var(--muted);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 1px 5px;
          margin-top: 3px;
        }
        .badge-alerte {
          color: #E4B5AE !important;
          border-color: rgba(192, 86, 74, 0.5) !important;
          background: rgba(192, 86, 74, 0.12);
        }
        .deal-decote {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 19px; font-weight: 600;
          margin-top: 7px;
        }
        .deal-decote.fort { color: var(--green); }
        .deal-decote.moyen { color: var(--amber); }
        .deal-decote.faible { color: var(--muted); }
        .deal-ref { font-size: 11px; color: var(--muted); margin-top: 1px; }
        .deal-ref-brute { font-size: 10.5px; color: #5F6775; margin-top: 2px; }

        .vides {
          background: var(--panel);
          border: 1px dashed var(--border);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 12px;
          color: var(--muted);
          line-height: 1.6;
        }
        .vides strong { color: var(--text); font-weight: 600; }

        .brut-scroll { overflow-x: auto; }
        .brut {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
          min-width: 720px;
        }
        .brut th {
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          padding: 7px 9px;
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }
        .brut td {
          padding: 8px 9px;
          border-bottom: 1px solid var(--border);
          vertical-align: top;
        }
        .brut tr:last-child td { border-bottom: none; }
        .brut .num { text-align: right; }
        .mono-cell { font-family: 'IBM Plex Mono', monospace; white-space: nowrap; }
        .brut-titre { font-weight: 600; }
        .brut-version {
          font-size: 11px; color: var(--muted);
          max-width: 220px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .brut-type {
          font-size: 10px;
          color: var(--muted);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 1px 5px;
          white-space: nowrap;
        }
        .brut-lien { color: var(--amber); display: inline-flex; }

        @media (max-width: 620px) {
          .deal { flex-wrap: wrap; }
          .deal-chiffres { text-align: left; width: 100%; }
        }
      `}</style>

      <div className="alcopa-meta">
        <div className="meta-tuile">
          <div className="meta-label">Lots collectés</div>
          <div className="meta-valeur">{donnees.nb_vehicules_collectes}</div>
        </div>
        <div className="meta-tuile">
          <div className="meta-label">Affaires retenues</div>
          <div className="meta-valeur">{totalAffaires}</div>
        </div>
        <div className="meta-tuile">
          <div className="meta-label">Source</div>
          <div className="meta-valeur petit">{donnees.source}</div>
        </div>
        <div className="meta-tuile">
          <div className="meta-label">Généré le</div>
          <div className="meta-valeur petit">
            {new Date(donnees.genere_le).toLocaleString("fr-FR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </div>
        </div>
      </div>

      <div className="alerte">
        <AlertTriangle size={15} />
        <div>{donnees.avertissement}</div>
      </div>

      <div className="bascule">
        <button className={!vueBrute ? "actif" : ""} onClick={() => setVueBrute(false)}>
          <Gavel size={13} /> Affaires ({totalAffaires})
        </button>
        <button className={vueBrute ? "actif" : ""} onClick={() => setVueBrute(true)}>
          <Table size={13} /> Tous les lots ({donnees.nb_vehicules_collectes})
        </button>
      </div>

      {vueBrute ? (
        <TableauBrut vehicules={donnees.vehicules} />
      ) : (
        <>
          {sectionsAvecAffaires.map((section) => (
            <div className="sect" key={section.modele}>
              <div className="sect-tete">
                <span className="sect-nom">{section.modele}</span>
                <span className="sect-info">
                  {section.nb_lots_analyses} lot(s) · moyenne marché{" "}
                  {eur(section.prix_moyen_marche)}
                </span>
              </div>
              {section.top.map((vehicule, i) => (
                <DealCard key={vehicule.id || vehicule.url} vehicule={vehicule} rang={i + 1} />
              ))}
            </div>
          ))}

          {sectionsVides.length > 0 && (
            <div className="vides">
              <strong>Aucun lot pour :</strong>{" "}
              {sectionsVides.map((s) => s.modele).join(", ")}.
              <br />
              Ces modèles sont suivis dans <code>config.py</code> mais absents de cette
              page de vente.
            </div>
          )}
        </>
      )}
    </div>
  );
}
