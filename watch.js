const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

// Configuration
const config = {
    // Liste des dossiers à surveiller
    foldersToWatch: [
        './src',
        './public'
    ],
    // Chemin vers le script JS à exécuter lors d'un changement
    scriptToExecute: './build.js',
    // Extensions de fichiers à surveiller (laisser vide pour surveiller tous les fichiers)
    fileExtensions: [],
    // Délai de debounce en millisecondes
    debounceDelay: 300
};

// Options pour chokidar
const watchOptions = {
    persistent: true,
    ignoreInitial: true, // On ignore les événements initiaux de Chokidar
    awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
    },
    ignored: /(^|[\/\\])\../ // Ignore les fichiers cachés
};

// Création du pattern de chemin pour les dossiers et extensions
let watchPaths = [];
config.foldersToWatch.forEach(folder => {
    if (config.fileExtensions.length === 0) {
        watchPaths.push(path.join(folder, '**/*')); // Tous les fichiers
    } else {
        config.fileExtensions.forEach(ext => {
            watchPaths.push(path.join(folder, `**/*${ext}`));
        });
    }
});

console.log(`🔍 Surveillance des dossiers: ${config.foldersToWatch.join(', ')}`);
if (config.fileExtensions.length > 0) {
    console.log(`📄 Extensions surveillées: ${config.fileExtensions.join(', ')}`);
}
console.log(`🚀 Script à exécuter: ${config.scriptToExecute}`);

// Fonction pour exécuter le script
function executeScript(changedFilePath = null) {
    const message = changedFilePath 
        ? `📝 Changement détecté dans: ${changedFilePath}`
        : `🚀 Exécution initiale du script`;
    
    console.log(`\n${message}`);
    console.log(`⚙️ Exécution de: ${config.scriptToExecute}`);
    
    const command = changedFilePath 
        ? `node ${config.scriptToExecute} "${changedFilePath}"`
        : `node ${config.scriptToExecute}`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Erreur d'exécution: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`⚠️ Stderr: ${stderr}`);
        }
        console.log(`✅ Résultat de l'exécution:\n${stdout}`);
    });
}

// Variable pour enregistrer le dernier timestamp d'exécution pour le debounce
let lastExecTime = 0;

// Fonction pour gérer le debounce
function debouncedExecute(path) {
    const now = Date.now();
    if (now - lastExecTime < config.debounceDelay) {
        return;
    }
    lastExecTime = now;
    executeScript(path);
}

// Exécuter le script une première fois au démarrage
console.log("🏁 Démarrage du programme");
executeScript();

// Initialisation de chokidar
const watcher = chokidar.watch(watchPaths, watchOptions);

// Gestion des événements de changement
watcher
    .on('change', path => debouncedExecute(path))
    .on('add', path => debouncedExecute(path))
    .on('unlink', path => {
        console.log(`🗑️ Fichier supprimé: ${path}`);
        // Optionnel: décider si on exécute le script lors d'une suppression
        debouncedExecute(path);
    })
    .on('error', error => console.error(`❌ Erreur de surveillance: ${error}`))
    .on('ready', () => console.log('✅ Surveillance initialisée! En attente de modifications...\n'));

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt de la surveillance et fermeture...');
    watcher.close().then(() => process.exit(0));
});