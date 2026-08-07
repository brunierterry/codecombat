# Japanese JavaScript Quest

Campagne locale et autonome de **28 missions** pour apprendre JavaScript à un enfant japonais.
Elle utilise les fichiers statiques du dépôt CodeCombat, mais **aucun niveau officiel ou Premium**.

Les règles fonctionnelles complètes sont dans [`docs/PRODUCT_RULES.md`](../../../docs/PRODUCT_RULES.md). Les contraintes générales de contribution sont dans [`docs/DEVELOPMENT_RULES.md`](../../../docs/DEVELOPMENT_RULES.md).

## Lancer le jeu sous Windows

```powershell
cd .\app\assets\japanese-js-quest
py -m http.server 8000
```

Puis ouvre :

```text
http://localhost:8000/
```

Le mode autonome utilise directement l'éditeur texte intégré et ne tente pas de charger l'éditeur Ace absent de ce serveur statique.

## Branche de cette PR

```powershell
cd D:\yuzu-dev\codecombat
git fetch origin
git switch --track origin/feature/japanese-js-quest-mission-types-first-pack
```

Si la branche existe déjà localement :

```powershell
git switch feature/japanese-js-quest-mission-types-first-pack
git pull --ff-only origin feature/japanese-js-quest-mission-types-first-pack
```

Puis :

```powershell
cd .\app\assets\japanese-js-quest
py -m http.server 8000
```

Recharge avec `Ctrl+F5` après une mise à jour.

## Mode administrateur

```text
http://localhost:8000/?admin=1
```

Ce mode ajoute :

- un bouton qui débloque **et affiche** temporairement les 28 missions ;
- un bouton `答えを見る` disponible immédiatement pour la solution finale ;
- un bouton `ADMIN：正解を選ぶ` dans chaque mini-quiz ;
- un bouton de validation en masse des cartes de la mission concept courante.

Le déblocage admin ne modifie pas la progression normale persistée.

## Types de missions

Chaque mission possède un type canonique :

- `concept` 💡 : introduction d'un nouveau concept JavaScript ;
- `adventure` 🗺️ : nouvelle aventure utilisant seulement les concepts déjà appris ;
- `typo-fix` 🔧 : correction d'une erreur de frappe ou de syntaxe ;
- `logic-fix` 🧩 : code valide mais raisonnement incorrect ;
- `boss` 🐉 : défi final du bloc avec mécaniques de monde particulières.

À partir de la mission concept 01, le motif de renforcement est :

```text
concept → adventure → typo-fix → logic-fix → adventure → boss
```

La mission 00 est l'exception : elle sert uniquement à découvrir l'environnement et n'a pas de pack de renforcement.

## Premier pack de renforcement

Les missions 00 et 01 restent les missions concept existantes. Cinq missions sont insérées ensuite :

- **02 — 宝石の一本道** : aventure avec déplacements répétés ;
- **03 — こわれたカッコ** : typo-fix avec un crochet incorrect ;
- **04 — 動くけど、ちがう！** : logic-fix dont le programme s'exécute mais rate la gemme ;
- **05 — 往復トンネル** : aventure aller-retour ;
- **06 — 炎のドラゴン** : boss avec dragon, ligne de feu, pilier et levier.

L'ancienne mission 02 devient la mission 07 et toutes les missions concept suivantes sont décalées de cinq positions. Les anciennes sauvegardes de code et de progression sont migrées automatiquement.

Les cinq nouvelles missions n'introduisent aucune nouvelle syntaxe JavaScript : elles utilisent seulement `hero.move(direction)`, les directions déjà vues et les commentaires.

### Boss dragon

Le dragon crache du feu horizontalement jusqu'au pilier. Si le héros entre dans cette ligne avant d'avoir activé le levier, l'exécution visible s'arrête et le feu se propage sur le field. Le héros doit contourner le pilier, activer le levier, récupérer la gemme puis atteindre le goal.

Le dragon ennemi est une mécanique du monde et ne révèle pas le futur pouvoir `hero.transform("dragon")`.

## Navigation sans effet tunnel

Le menu latéral n'affiche pas toute la campagne :

- au démarrage : seulement missions 00 et 01 ;
- après la mission 00 : missions 01 à 07, soit le concept courant, ses cinq renforcements et le concept suivant ;
- après le boss : le segment visible avance au concept suivant ;
- en admin après `全ミッションを開く` : toutes les missions sont visibles et déverrouillées.

Les types non-concept ont seulement une légère différence visuelle dans le menu. L'emoji et le nom du type apparaissent dans la mission ouverte.

## Cartes de concepts et mini-quiz

Les 36 cartes originales de `新しい考え方`, plus les deux cartes `JavaScript` et `Editor`, forment **38 cartes canoniques**.

La mission 01 contient `JavaScript`, `Editor`, `// はコメント（Comment）`, puis `hero.move(direction)`. Elles utilisent toutes le même parcours : face cachée, prévisualisation, mini-quiz, validation et mémorisation.

Les missions `adventure`, `typo-fix`, `logic-fix` et `boss` n'ont pas de fausses cartes de concept et ne sont pas bloquées par le système de cartes.

Chaque carte possède une à trois questions. En cas d'erreur, la bonne réponse n'est pas révélée. Les mots difficiles ont les mêmes infobulles de lecture dans les explications, les cartes et les quiz.

Les IDs validés sont enregistrés dans :

```text
japanese-js-quest-concept-memory-v1
```

## Coloration pédagogique et éditeur

Quand l'éditeur n'a pas le focus :

- bleu : objets, variables et constantes ;
- violet : méthodes ;
- rouge : valeurs littérales ;
- gris : commentaires ;
- blanc : syntaxe et opérateurs.

Au clic dans la prévisualisation, le curseur est placé à l'endroit correspondant dans l'éditeur réel. La ligne de raccourcis contient `Ctrl+Enter`, `Ctrl+C`, `Ctrl+V`, `Ctrl+Z` et `Ctrl+F5`, avec retour responsive à la ligne sans scroll horizontal.

Toutes les zones défilables utilisent le même thème bleu que l'éditeur.

## Progression des concepts après insertion

Quelques repères après renumérotation :

- mission 00 : `hero.say("Hello Yuzu")` ;
- mission 01 : JavaScript, Editor, commentaires et `hero.move(direction)` ;
- missions 02–06 : premier pack de renforcement ;
- mission 07 : transformation en grenouille ;
- mission 08 : booléens, `const`, affectation et `hero.isTrue(boolean)` ;
- mission 09 : premier `if` ;
- mission 16 : première boucle `for` ;
- mission 19 : démonstration volontaire de `while (true)` ;
- mission 20 : première boucle `while (!hero.isAtGoal())` ;
- missions suivantes : boucles imbriquées et combinaison des concepts.

## Validation locale

Depuis la racine du dépôt :

```powershell
node scripts/validate-japanese-js-quest.js
node scripts/validate-japanese-js-quest-runtime.js
node scripts/validate-japanese-js-quest-loop-rules.js
node scripts/validate-japanese-js-quest-learning-reinforcement.js
node scripts/validate-japanese-js-quest-editor-header-and-card-extension.js
node scripts/validate-japanese-js-quest-mission-pack-v1.js
```
