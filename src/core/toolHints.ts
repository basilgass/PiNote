import type { ToolType } from '../types'

export const TOOL_HINTS: Record<ToolType, string> = {
    pen:         'Tracé libre à main levée.',
    highlighter: 'Surlignage à main levée avec opacité réduite.',
    eraser:      'Effacez les traits en les survolant avec le bouton enfoncé.',
    move:        'Cliquez et glissez pour déplacer la vue.',
    select:      'Cliquez sur une forme pour la sélectionner, puis glissez pour la déplacer.',
    line:        "Cliquez pour poser deux points. La droite s'étend à l'infini dans les deux sens.",
    segment:     'Cliquez et glissez entre deux points pour tracer un segment borné.',
    vector:      'Cliquez et glissez pour tracer un vecteur orienté avec une flèche.',
    circle:      'Cliquez pour définir le centre, glissez pour fixer le rayon.',
    rectangle:   '2pts : glissez pour tracer le rectangle. 3pts : glissez pour l\'arête, relâchez, puis glissez pour la largeur.',
    polygon:     'Cliquez pour ajouter des sommets un par un. Double-clic pour fermer et terminer.',
}
