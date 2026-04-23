// ═══════════════════════════════════════════════
//  i18n — Les Fromages du Bonheur
//  Bilingual FR/EN support
// ═══════════════════════════════════════════════

(function(){
'use strict';

var translations = {
  fr: {
    // Navigation
    'home_btn': '← Page principale',
    'search_placeholder': 'Chercher un fromage...',
    'filters': 'Filtres',
    'filter_by': 'Filtrer par',
    'view': 'Vue',
    'map': 'Carte',
    'all_cheeses': 'Tous les fromages',
    'reset': 'Réinitialiser',
    'reset_filters': '✕ Réinitialiser filtres',
    'apply': 'Appliquer',
    'close': 'Fermer',
    'reduce': 'Réduire',
    'back': 'Retour',
    'next': 'Suivant',

    // Nav dropdown
    'itinerary': 'Itinéraire',
    'learn_more': 'En savoir plus',
    'about': 'À propos',
    'contact': 'Contact',
    'definitions': 'Définitions',
    'chroniques_nav': 'Chroniques',
    'suggest_cheese': 'Suggérer un fromage',
    'my_itinerary': 'Mon itinéraire',
    'create_itinerary': 'Créer un itinéraire',

    // Filter labels
    'species': 'Espèce',
    'label': 'Label',
    'region': 'Région',
    'paste_type': 'Pâte',
    'season': 'Saison',
    'taste': 'Goût',
    'all_m': 'Tous',
    'all_f': 'Toutes',
    'special_labels': 'Labels spéciaux',
    'organic': 'Bio',
    'monastic': 'Monastique',
    'eponymous': 'Éponyme',
    'paste_type_full': 'Type de pâte',

    // Cheese detail
    'characteristics': 'Caractéristiques',
    'milk_type': 'Type de lait',
    'aging': 'Affinage',
    'best_season': 'Saison optimale',
    'not_specified': 'Non précisé',
    'fun_fact': 'Fun Fact',
    'monastic_heritage': 'Héritage monastique',
    'appellation': 'Appellation',
    'aop_date': 'Date AOP',
    'aoc_date': 'Date AOC',
    'igp_date': 'Date IGP',
    'gmo_specs': 'OGM (cahier des charges)',
    'farmstead_production': 'Production fermière',
    'production_seasonality': 'Saisonnalité de production',
    'comment': 'Commentaire',
    'producers': 'Producteurs',
    'click_producer_locate': 'Cliquez sur un producteur pour le localiser sur la carte',
    'add_to_itinerary': '+Itinéraire',
    'add_to_itinerary_long': '+ Ajouter à l\'itinéraire',
    'click_add_itinerary': 'Cliquez pour ajouter à l\'itinéraire',
    'eponymous_municipalities': 'Communes éponymes',
    'view_on_map': 'Voir sur la carte',
    'share': 'Partager',
    'link_copied': '✓ Lien copié !',
    'copy_link': 'Copier ce lien :',
    'favorite': 'Favori',
    'add_to_favorites': 'Ajouter aux favoris',
    'see_details': '↑ Voir les détails',
    'close_detail': 'Fermer ↓',

    // Map legend
    'legend': 'Légende',
    'map_legend': 'Légende carte',
    'cheese': 'Fromage',
    'cheeses': 'fromages',
    'producer': 'Producteur',
    'eponymous_commune': 'Commune éponyme',
    'production_zone': 'Zone de production',
    'production_zones': 'Zones de production',
    'my_position': 'Ma position',
    'zoom_in': 'Zoomer',
    'zoom_out': 'Dézoomer',

    // Itinerary panel
    'my_cheese_itinerary': 'Mon itinéraire fromager',
    'export_itinerary': "Exporter l'itinéraire",
    'car': '🚗 Voiture',
    'bike': '🚴 Vélo',
    'walking': '🚶 À pied',
    'draw_on_map': "Tracer l'itinéraire sur la carte",
    'clear_itinerary': "Vider l'itinéraire",
    'add_producers_create': 'Ajoutez des producteurs pour créer votre itinéraire',
    'itin_add_producers': 'Ajoutez des producteurs',
    'itin_or_create': 'ou créez votre itinéraire',
    'my_location_start': '📍 Ma position comme départ',
    'starting_point': 'Point de départ',
    'already_in_itinerary': "Déjà dans l'itinéraire",
    'added_to_itinerary': "ajouté à l'itinéraire",
    'add_at_least_2': 'Ajoutez au moins 2 étapes',
    'missing_gps': 'Coordonnées GPS manquantes',
    'distance': 'Distance',
    'round_trip': 'aller-retour',
    'simplified_route': '(tracé simplifié — serveur indisponible)',

    // Itinerary generator
    'your_cheese_itinerary': 'Votre itinéraire fromager',
    'wizard_subtitle': 'En quelques clics, on vous prépare une tournée sur mesure',
    'where_are_you': 'Où êtes-vous ?',
    'my_current_location': 'Ma position actuelle',
    'use_geolocation': 'Utiliser la géolocalisation',
    'enter_city': 'Entrer une ville',
    'type_starting_point': 'Tapez votre point de départ',
    'city_placeholder': 'Ex : Lyon, Dijon, Strasbourg...',
    'how_long': 'Combien de temps ?',
    'half_day': 'Demi-journée',
    'full_day': 'Journée',
    'weekend': 'Week-end',
    'vacation': 'Vacances',
    'half_day_detail': '2-4 étapes',
    'full_day_detail': '4-6 étapes',
    'weekend_detail': '2 jours · 6-10 étapes',
    'vacation_detail': '3+ jours · 10+ étapes',
    'how_travel': 'Comment vous déplacez-vous ?',
    'by_car': 'Voiture',
    'by_bike': 'Vélo',
    'on_foot': 'À pied',
    'your_preferences': 'Vos envies ?',
    'optional': 'optionnel',
    'mild': 'Doux',
    'balanced': 'Équilibré',
    'intense': 'Intense',
    'strong': 'Puissant',
    'goat': 'Chèvre',
    'sheep': 'Brebis',
    'generate_itinerary': 'Générer mon itinéraire',
    'creating_itinerary': 'Création de votre itinéraire…',
    'your_cheese_tour': 'Votre tournée fromage',
    'stops': 'étapes',
    'from_city': 'depuis',
    'your_city': 'Votre ville',
    'ambitious_radius': 'Itinéraire ambitieux — rayon élargi à ~{radius} km pour plus de découvertes',
    'no_itinerary_yet': "Pas encore d'itinéraire disponible",
    'no_producers_found': "Même en élargissant la recherche, nous n'avons pas trouvé assez de producteurs avec ces critères.",
    'try_modify': 'Essayez de modifier vos préférences ou votre point de départ.',
    'modify_preferences': 'Modifier mes préférences',
    'change_duration': 'Changer la durée',
    'change_starting_point': 'Changer le point de départ',
    'view_on_map_emoji': '🗺️ Voir sur la carte',
    'modify_choices': 'Modifier mes choix',
    'departure_at': 'Départ · à {dist} km',

    // Empty states
    'no_favorites_yet': 'Pas encore de favoris',
    'favorites_hint': "Cliquez sur le cœur d'un fromage pour l'ajouter à vos favoris.",
    'view_all_cheeses': 'Voir tous les fromages',
    'no_cheese_found': 'Aucun fromage trouvé',
    'try_modify_filters': 'Essayez de modifier vos filtres ou votre recherche pour découvrir d\'autres fromages.',

    // Mobile tabs
    'tab_map': 'Carte',
    'tab_cheeses': 'Fromages',
    'tab_itinerary': 'Itinéraire',
    'tab_favorites': 'Favoris',
    'tab_more': 'Plus',

    // Geolocation
    'geolocation_unavailable': 'Géolocalisation non disponible.',
    'you_are_here': 'Vous êtes ici',

    // Welcome
    'welcome': 'Bienvenue !',
    'welcome_text': 'Découvrez les fromages français, localisez les producteurs et créez votre itinéraire fromager.',
    'locate_explore': '📍 Me localiser et explorer',
    'create_cheese_itinerary': '🗺️ Créer un itinéraire fromager',
    'explore_map': 'Explorer la carte directement',

    // Tooltips & misc
    'cheeses_in_commune': 'fromages dans cette commune',
    'cheeses_at_location': 'fromages à cet endroit',
    'cheese_singular': 'fromage',
    'cheese_plural': 'fromages',
    'error': 'Erreur',

    // Footer
    'footer': '© 2025–2026 <a href="mailto:lesfromagesdubonheur@gmail.com">Les Fromages du Bonheur</a> · Carte interactive des fromages de France · Données compilées à la main avec amour · <a href="https://www.instagram.com/lesfromagesdubonheur/" target="_blank" rel="noopener" style="color:#8B6F47;">Instagram</a>',

    // Pages
    'about_title': 'Les Fromages du Bonheur',
    'about_p1': "J'ai voulu créer la carte interactive la plus exhaustive des fromages de France — pour découvrir chaque fromage, trouver les producteurs, et créer ses propres itinéraires fromagers pour aller les goûter. En voiture, à vélo ou à pied !",
    'about_p2': "Tout est parti d'une envie simple — découvrir les fromages de France où que je sois. Et d'une fascination : comment avec trois laits — vache, chèvre, brebis — arrive-t-on à une telle myriade de fromages ? Derrière chaque fromage, il y a aussi un savoir-faire ancestral perpétué par des gens passionnés. J'ai essayé de le mettre en valeur, notamment à travers les producteurs fermiers sélectionnés sur le site.",
    'about_subtitle': 'Sur le site',
    'about_p3': "Chaque fiche fromage indique son type de pâte, son affinage, sa saison idéale, son goût, son histoire — origine monastique, ou commune éponyme quand elle existe... Il y a aussi des détails sur les labels AOP, AOC, IGP. On peut localiser les producteurs sur la carte et créer ses itinéraires fromagers exportables.",
    'about_p4': "La base ne sera probablement jamais complète — ni pour les fromages, ni pour les producteurs ! J'ai commencé par la France métropolitaine, mais j'aimerais agrandir, et il me manque certainement des fromages même en métropole. Un fromage qui manque ? Un producteur à ajouter ? N'hésitez pas à le <a href=\"#\" onclick=\"event.preventDefault();window._goHome();window._openPage('suggest');\">suggérer</a> !",
    'about_signoff': '— Claire',

    'contact_title': 'Contact',
    'contact_text': 'Une question, une suggestion, une correction ? Écrivez-moi !',

    'suggest_title': 'Suggérer un fromage',
    'suggest_text': 'Vous connaissez un fromage qui manque à notre carte ? Dites-le nous !',
    'suggest_name': 'Nom du fromage *',
    'suggest_name_placeholder': 'Ex : Tome des Bauges',
    'suggest_region': 'Région / Département',
    'suggest_region_placeholder': 'Ex : Savoie',
    'suggest_details': 'Informations complémentaires',
    'suggest_details_placeholder': 'Type de lait, producteur connu, lien web...',
    'suggest_submit': 'Envoyer la suggestion',

    'definitions_title': 'Définitions',
    'definitions_text': 'Cette page est en cours de construction. Revenez bientôt !',

    // Install banner
    'install_app': 'Installer l\'appli',
    'install_banner_text': 'Ajoutez Fromages du Bonheur sur votre téléphone',
    'install_button': 'Installer',
    'install_ios_title': 'Ajouter à l\'écran d\'accueil',
    'install_ios_step1': 'Appuyez sur le bouton <strong>Partager</strong> (carré avec flèche)',
    'install_ios_step2': 'Sélectionnez <strong>Sur l\'écran d\'accueil</strong>',
    'install_ios_step3': 'Appuyez sur <strong>Ajouter</strong>',
    'install_got_it': 'Compris !',

    // Language
    'lang_switch': '🇬🇧 EN'
  },

  en: {
    // Navigation
    'home_btn': '← Home',
    'search_placeholder': 'Search for a cheese...',
    'filters': 'Filters',
    'filter_by': 'Filter by',
    'view': 'View',
    'map': 'Map',
    'all_cheeses': 'All cheeses',
    'reset': 'Reset',
    'reset_filters': '✕ Reset filters',
    'apply': 'Apply',
    'close': 'Close',
    'reduce': 'Minimize',
    'back': 'Back',
    'next': 'Next',

    // Nav dropdown
    'itinerary': 'Itinerary',
    'learn_more': 'Learn more',
    'about': 'About',
    'contact': 'Contact',
    'definitions': 'Definitions',
    'chroniques_nav': 'Newsletter',
    'suggest_cheese': 'Suggest a cheese',
    'my_itinerary': 'My itinerary',
    'create_itinerary': 'Create an itinerary',

    // Filter labels
    'species': 'Animal',
    'label': 'Label',
    'region': 'Region',
    'paste_type': 'Paste',
    'season': 'Season',
    'taste': 'Taste',
    'all_m': 'All',
    'all_f': 'All',
    'special_labels': 'Special labels',
    'organic': 'Organic',
    'monastic': 'Monastic',
    'eponymous': 'Eponymous',
    'paste_type_full': 'Paste type',

    // Cheese detail
    'characteristics': 'Characteristics',
    'milk_type': 'Milk type',
    'aging': 'Aging',
    'best_season': 'Best season',
    'not_specified': 'Not specified',
    'fun_fact': 'Fun Fact',
    'monastic_heritage': 'Monastic heritage',
    'appellation': 'Designation',
    'aop_date': 'AOP Date',
    'aoc_date': 'AOC Date',
    'igp_date': 'IGP Date',
    'gmo_specs': 'GMO (specifications)',
    'farmstead_production': 'Farmstead production',
    'production_seasonality': 'Production seasonality',
    'comment': 'Comment',
    'producers': 'Producers',
    'click_producer_locate': 'Click a producer to locate them on the map',
    'add_to_itinerary': '+Itinerary',
    'add_to_itinerary_long': '+ Add to itinerary',
    'click_add_itinerary': 'Click to add to itinerary',
    'eponymous_municipalities': 'Eponymous municipalities',
    'view_on_map': 'View on map',
    'share': 'Share',
    'link_copied': '✓ Link copied!',
    'copy_link': 'Copy this link:',
    'favorite': 'Favorite',
    'add_to_favorites': 'Add to favorites',
    'see_details': '↑ See details',
    'close_detail': 'Close ↓',

    // Map legend
    'legend': 'Legend',
    'map_legend': 'Map legend',
    'cheese': 'Cheese',
    'cheeses': 'cheeses',
    'producer': 'Producer',
    'eponymous_commune': 'Eponymous municipality',
    'production_zone': 'Production zone',
    'production_zones': 'Production zones',
    'my_position': 'My location',
    'zoom_in': 'Zoom in',
    'zoom_out': 'Zoom out',

    // Itinerary panel
    'my_cheese_itinerary': 'My cheese itinerary',
    'export_itinerary': 'Export itinerary',
    'car': '🚗 Car',
    'bike': '🚴 Bike',
    'walking': '🚶 Walking',
    'draw_on_map': 'Draw itinerary on map',
    'clear_itinerary': 'Clear itinerary',
    'add_producers_create': 'Add producers to create your itinerary',
    'itin_add_producers': 'Add producers',
    'itin_or_create': 'or create your itinerary',
    'my_location_start': '📍 My location as starting point',
    'starting_point': 'Starting point',
    'already_in_itinerary': 'Already in itinerary',
    'added_to_itinerary': 'added to itinerary',
    'add_at_least_2': 'Add at least 2 stops',
    'missing_gps': 'Missing GPS coordinates',
    'distance': 'Distance',
    'round_trip': 'round trip',
    'simplified_route': '(simplified route — server unavailable)',

    // Itinerary generator
    'your_cheese_itinerary': 'Your cheese itinerary',
    'wizard_subtitle': 'In a few clicks, we\'ll create a custom tour for you',
    'where_are_you': 'Where are you?',
    'my_current_location': 'My current location',
    'use_geolocation': 'Use geolocation',
    'enter_city': 'Enter a city',
    'type_starting_point': 'Type your starting point',
    'city_placeholder': 'E.g.: Paris, Lyon, Bordeaux...',
    'how_long': 'How long?',
    'half_day': 'Half day',
    'full_day': 'Full day',
    'weekend': 'Weekend',
    'vacation': 'Vacation',
    'half_day_detail': '2-4 stops',
    'full_day_detail': '4-6 stops',
    'weekend_detail': '2 days · 6-10 stops',
    'vacation_detail': '3+ days · 10+ stops',
    'how_travel': 'How are you travelling?',
    'by_car': 'Car',
    'by_bike': 'Bike',
    'on_foot': 'On foot',
    'your_preferences': 'Your preferences?',
    'optional': 'optional',
    'mild': 'Mild',
    'balanced': 'Balanced',
    'intense': 'Intense',
    'strong': 'Very strong',
    'goat': 'Goat',
    'sheep': 'Sheep',
    'generate_itinerary': 'Generate my itinerary',
    'creating_itinerary': 'Creating your itinerary…',
    'your_cheese_tour': 'Your cheese tour',
    'stops': 'stops',
    'from_city': 'from',
    'your_city': 'Your city',
    'ambitious_radius': 'Ambitious itinerary — expanded radius to ~{radius} km for more discoveries',
    'no_itinerary_yet': 'No itinerary available yet',
    'no_producers_found': "Even with expanded search, we didn't find enough producers matching your criteria.",
    'try_modify': 'Try modifying your preferences or starting point.',
    'modify_preferences': 'Modify my preferences',
    'change_duration': 'Change duration',
    'change_starting_point': 'Change starting point',
    'view_on_map_emoji': '🗺️ View on map',
    'modify_choices': 'Modify my choices',
    'departure_at': 'Departure · {dist} km away',

    // Empty states
    'no_favorites_yet': 'No favorites yet',
    'favorites_hint': 'Click the heart on a cheese to add it to your favorites.',
    'view_all_cheeses': 'View all cheeses',
    'no_cheese_found': 'No cheese found',
    'try_modify_filters': 'Try modifying your filters or search to discover other cheeses.',

    // Mobile tabs
    'tab_map': 'Map',
    'tab_cheeses': 'Cheeses',
    'tab_itinerary': 'Itinerary',
    'tab_favorites': 'Favorites',
    'tab_more': 'More',

    // Geolocation
    'geolocation_unavailable': 'Geolocation not available.',
    'you_are_here': 'You are here',

    // Welcome
    'welcome': 'Welcome!',
    'welcome_text': 'Discover French cheeses, locate producers, and create your cheese itinerary.',
    'locate_explore': '📍 Locate me and explore',
    'create_cheese_itinerary': '🗺️ Create a cheese itinerary',
    'explore_map': 'Explore the map directly',

    // Tooltips & misc
    'cheeses_in_commune': 'cheeses in this municipality',
    'cheeses_at_location': 'cheeses at this location',
    'cheese_singular': 'cheese',
    'cheese_plural': 'cheeses',
    'error': 'Error',

    // Footer
    'footer': '© 2025–2026 <a href="mailto:lesfromagesdubonheur@gmail.com">Les Fromages du Bonheur</a> · Interactive map of French cheeses · Data hand-compiled with love · <a href="https://www.instagram.com/lesfromagesdubonheur/" target="_blank" rel="noopener" style="color:#8B6F47;">Instagram</a>',

    // Pages
    'about_title': 'Les Fromages du Bonheur',
    'about_p1': "I wanted to create the most comprehensive interactive map of French cheeses — to discover every cheese, find the producers, and create your own cheese itineraries to go taste them. By car, by bike, or on foot!",
    'about_p2': "It all started from a simple desire — to discover French cheeses wherever I am. And from a fascination: how, with just three types of milk — cow, goat, sheep — do we end up with such an incredible variety of cheeses? Behind every cheese, there is also ancestral know-how carried on by passionate people. I've tried to highlight this, especially through the farmstead producers featured on the site.",
    'about_subtitle': 'On the site',
    'about_p3': "Each cheese page shows its paste type, aging, ideal season, taste, history — monastic origin, or eponymous municipality when applicable. There are also details on AOP, AOC, IGP designations. You can locate producers on the map and create exportable cheese itineraries.",
    'about_p4': "The database will probably never be complete — neither for cheeses nor for producers! I started with mainland France, but I'd like to expand, and I'm certainly missing cheeses even in the mainland. A cheese that's missing? A producer to add? Don't hesitate to <a href=\"#\" onclick=\"event.preventDefault();window._goHome();window._openPage('suggest');\">suggest it</a>!",
    'about_signoff': '— Claire',

    'contact_title': 'Contact',
    'contact_text': 'A question, a suggestion, a correction? Write to me!',

    'suggest_title': 'Suggest a cheese',
    'suggest_text': 'Know a cheese that\'s missing from our map? Let us know!',
    'suggest_name': 'Cheese name *',
    'suggest_name_placeholder': 'E.g.: Tome des Bauges',
    'suggest_region': 'Region / Department',
    'suggest_region_placeholder': 'E.g.: Savoie',
    'suggest_details': 'Additional information',
    'suggest_details_placeholder': 'Milk type, known producer, web link...',
    'suggest_submit': 'Send suggestion',

    'definitions_title': 'Definitions',
    'definitions_text': 'This page is under construction. Come back soon!',

    // Install banner
    'install_app': 'Install app',
    'install_banner_text': 'Add Fromages du Bonheur to your phone',
    'install_button': 'Install',
    'install_ios_title': 'Add to Home Screen',
    'install_ios_step1': 'Tap the <strong>Share</strong> button (square with arrow)',
    'install_ios_step2': 'Select <strong>Add to Home Screen</strong>',
    'install_ios_step3': 'Tap <strong>Add</strong>',
    'install_got_it': 'Got it!',

    // Language
    'lang_switch': '🇫🇷 FR'
  }
};

// Fixed cheese field value translations (pâte, goût, saison, label, espèce)
var fieldTranslations = {
  en: {
    // Pâte types
    'Pâte molle à croûte fleurie': 'Soft cheese, bloomy rind',
    'Pâte molle à croûte lavée': 'Soft cheese, washed rind',
    'Pâte molle à croûte naturelle': 'Soft cheese, natural rind',
    'Pâte pressée non-cuite': 'Uncooked pressed cheese',
    'Pâte pressée cuite': 'Cooked pressed cheese',
    'Pâte persillée': 'Blue cheese',
    'Pâte fraîche': 'Fresh cheese',
    'Pâte filée': 'Stretched curd cheese',
    'Fromage fondu': 'Processed cheese',
    // Short pâte names (used in filter dropdowns)
    'Croûte fleurie': 'Bloomy rind',
    'Croûte lavée': 'Washed rind',
    'Croûte naturelle': 'Natural rind',
    'Persillée': 'Blue cheese',
    'Pressée cuite': 'Cooked pressed',
    'Pressée non-cuite': 'Uncooked pressed',
    'Fondue': 'Processed',
    'Filée': 'Stretched curd',
    'Autre': 'Other',

    // Goût
    'Doux': 'Mild',
    'Équilibré': 'Balanced',
    'Intense': 'Intense',
    'Puissant': 'Very strong',

    // Saison
    'Printemps': 'Spring',
    'Été': 'Summer',
    'Automne': 'Fall',
    'Hiver': 'Winter',
    'Toute l\'année': 'Year-round',

    // Espèce
    'Vache': 'Cow',
    'Chèvre': 'Goat',
    'Brebis': 'Sheep',
    'Bufflonne': 'Buffalo',

    // Labels
    'Fromage Artisanal': 'Artisanal Cheese',
    'Fromage Fermier': 'Farmstead Cheese',
    'Fromage Industriel': 'Industrial Cheese',
    'Fromage de Monastère': 'Monastic Cheese',

    // Lait
    'Lait Cru': 'Raw Milk',
    'Lait Pasteurisé': 'Pasteurized Milk',
    'Lait Thermisé': 'Thermized Milk',
    "Non précisé / Pas d'obligation": 'Not specified',
  }
};

// ── State ──
var currentLang = localStorage.getItem('fdh_lang') || (navigator.language && navigator.language.startsWith('en') ? 'en' : 'fr');

// ── Public API ──
window.T = function(key, params) {
  var dict = translations[currentLang] || translations['fr'];
  var s = dict[key] || translations['fr'][key] || key;
  if (params) {
    for (var k in params) {
      s = s.replace('{' + k + '}', params[k]);
    }
  }
  return s;
};

window.TF = function(value) {
  if (!value || currentLang === 'fr') return value;
  // Try to translate each part (for compound values like "Printemps, Été")
  var ft = fieldTranslations[currentLang] || {};
  if (ft[value]) return ft[value];
  // Try splitting by comma
  var parts = value.split(',').map(function(p) { return p.trim(); });
  var translated = parts.map(function(p) { return ft[p] || p; });
  return translated.join(', ');
};

window.getLang = function() { return currentLang; };

window.setLang = function(lang) {
  currentLang = lang;
  localStorage.setItem('fdh_lang', lang);
  applyTranslations();
  // Notify app.js to refresh dynamic content
  if (window._onLangChange) window._onLangChange(lang);
};

window.toggleLang = function() {
  setLang(currentLang === 'fr' ? 'en' : 'fr');
};

// ── Apply translations to static HTML elements ──
function applyTranslations() {
  // Elements with data-t attribute get their textContent translated
  var els = document.querySelectorAll('[data-t]');
  for (var i = 0; i < els.length; i++) {
    var key = els[i].getAttribute('data-t');
    if (key) {
      if (els[i].getAttribute('data-t-html') === 'true') {
        els[i].innerHTML = T(key);
      } else {
        els[i].textContent = T(key);
      }
    }
  }

  // Placeholders
  var phs = document.querySelectorAll('[data-t-placeholder]');
  for (var i = 0; i < phs.length; i++) {
    phs[i].placeholder = T(phs[i].getAttribute('data-t-placeholder'));
  }

  // ARIA labels
  var arias = document.querySelectorAll('[data-t-aria]');
  for (var i = 0; i < arias.length; i++) {
    arias[i].setAttribute('aria-label', T(arias[i].getAttribute('data-t-aria')));
  }

  // Title attributes
  var titles = document.querySelectorAll('[data-t-title]');
  for (var i = 0; i < titles.length; i++) {
    titles[i].title = T(titles[i].getAttribute('data-t-title'));
  }

  // Update lang attribute
  document.documentElement.lang = currentLang;

  // Update lang switch button
  var langBtn = document.getElementById('langToggle');
  if (langBtn) langBtn.textContent = T('lang_switch');
}

// ── Initialize on DOM ready ──
function init() {
  applyTranslations();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
