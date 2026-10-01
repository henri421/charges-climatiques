import { describe, expect, it } from 'vitest';
import {
  aireChargeeDepuisModele,
  batimentDepuisModele,
  champsDepuisModele,
  modeleDepuisChamps,
  modeleParDefaut,
  siteDepuisModele,
} from '../../app/src/form';

function champs(modifs: Record<string, string> = {}): Record<string, string> {
  return { ...champsDepuisModele(modeleParDefaut()), ...modifs };
}

describe('saisie', () => {
  it('le modele par defaut ne porte AUCUNE grandeur de base', () => {
    const m = modeleParDefaut();
    expect(m.v_b0).toBeNull();
    expect(m.s_k).toBeNull();
  });

  it('aller-retour champs -> modele -> champs', () => {
    const lecture = modeleDepuisChamps(champs());
    expect(lecture.ok).toBe(true);
    if (lecture.ok) expect(champsDepuisModele(lecture.modele)).toEqual(champs());
  });

  it('virgule decimale acceptee', () => {
    const lecture = modeleDepuisChamps(champs({ s_k: '0,65', v_b0: '24,5' }));
    expect(lecture.ok && lecture.modele.s_k).toBe(0.65);
    expect(lecture.ok && lecture.modele.v_b0).toBe(24.5);
  });

  it('champ vide pour v_b,0 : null, pas une erreur de saisie', () => {
    const lecture = modeleDepuisChamps(champs({ v_b0: '' }));
    expect(lecture.ok && lecture.modele.v_b0).toBeNull();
  });

  it('texte illisible : refus motive nommant le champ', () => {
    const lecture = modeleDepuisChamps(champs({ hauteur: 'abc' }));
    expect(lecture.ok).toBe(false);
    if (!lecture.ok) expect(lecture.message).toContain('Hauteur h');
  });

  it('un champ masque n est pas exige', () => {
    // toiture plate : la pente n est pas lue
    const lecture = modeleDepuisChamps(champs({ pente: '' }));
    expect(lecture.ok).toBe(true);
    // un versant : la pente devient exigee
    expect(modeleDepuisChamps(champs({ toiture: 'un-versant', pente: '' })).ok).toBe(false);
  });

  it('valeur de liste inattendue : refus', () => {
    expect(modeleDepuisChamps(champs({ categorie: 'V' })).ok).toBe(false);
  });

  it('traduction vers le noyau', () => {
    const lecture = modeleDepuisChamps(
      champs({ toiture: 'deux-versants', pente1: '20', pente2: '25', obstacle: 'oui', obs_hauteur: '1,2', aire_mode: 'saisie', aire: '2' })
    );
    if (!lecture.ok) throw new Error(lecture.message);
    const b = batimentDepuisModele(lecture.modele);
    const s = siteDepuisModele(lecture.modele);
    expect(b.toiture).toEqual({ type: 'deux-versants', pente1: 20, pente2: 25 });
    expect(s.obstacles).toEqual([{ nom: 'edicule', hauteur: 1.2 }]);
    expect(s.toitureAdjacente).toBeNull();
    expect(s.C_t).toBeNull();
    expect(aireChargeeDepuisModele(lecture.modele)).toBe(2);
  });
});
