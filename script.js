var mj = (function() {

	var TOTAL_NUMBER_TILES = 136;
	var NUMBER_SAME_TILES = 4;
	var NUMBERS_PER_SUIT = 9;
	var TYPES_OF_TILES = 34;
	var FIRST_HONOR = 27;
	var MANS = 0;
	var PINS = 1;
	var SOUS = 2;
	var HONORS = 3;
	var SUITS = {
		'm': 0,
		'p': 1,
		's': 2,
		'z': 3,
	};

	var util = {
		shuffle: function(array) {
			var counter = array.length,
				temp, index;

			// While there are elements in the array
			while (counter > 0) {
				// Pick a random index
				index = Math.floor(Math.random() * counter);

				// Decrease counter by 1
				counter--;

				// And swap the last element with it
				temp = array[counter];
				array[counter] = array[index];
				array[index] = temp;
			}

			return array;
		},
		getTileSuit: function(tileNumber) {
			return Math.floor(tileNumber / NUMBERS_PER_SUIT);
		},
		getTileSuitLetter: function(tileNumber) {
			return ['m', 'p', 's', 'z'][util.getTileSuit(tileNumber)];
		},
		getTileNumber: function(tileNumber) {
			return tileNumber % NUMBERS_PER_SUIT + 1;
		},
		getTileImageURL: function(tileNumber) {
			var suit = util.getTileSuitLetter(tileNumber);
			var number = util.getTileNumber(tileNumber);
			return "img/" + number + suit + ".gif";
		},
		getTileImage: function($, tileNumber) {
			var img = new Image();
			img.src = util.getTileImageURL(tileNumber);
			return $(img).data('tile', tileNumber);
		},
		getHandFromString: function(handString) {
			var suit = -1;
			var hand = new mj.Hand();
			for (var i = handString.length - 1; i >= 0; i--) {
				var character = handString[i];
				if (typeof SUITS[character] != "undefined") {
					suit = SUITS[character];
					continue
				}
				if (suit == -1) {
					throw new Error("Missing suit in hand " + handString);
				}
				var number = parseInt(character) - 1;
				hand.add(number + suit * NUMBERS_PER_SUIT);
			};
			return hand;
		},
		printHandInfo: function(handString) {
			var hand = util.getHandFromString(handString);
			var calc = new mj.ShantenCalc(hand);
			console.log(calc.debug());
		},
	};


	var Wall = (function() {
		/**
		 *	Creates a shuffled wall of tiles
		 *
		 */
		function Wall() {
			this.tiles = [];
			for (var i = 0; i < TOTAL_NUMBER_TILES; i++) {
				this.tiles.push(i);
			}
			this.tiles = util.shuffle(this.tiles);
			this.index = 0;
		}

		/**
		 *	Gets the next tile in the wall
		 *	@return A tile from 0 to 34
		 */
		Wall.prototype.next = function() {
			var tile = this.tiles[this.index++];
			return Math.floor(tile / 4);
		}
		return Wall;
	}());

	var Hand = (function() {
		/**
		 *	Creates a new hand
		 *	@param tiles optional An array of tiles to add
		 */
		function Hand(tiles) {
			this.hand = [];
			if (tiles) {
				for (var i = 0; i < tiles.length; i++) {
					this.add(tiles[i]);
				}
			}
		}

		/**
		 *	Draws count tiles from the given wall
		 *	@param wall The wall
		 *	@param count Number of tiles (default = 1)
		 */
		Hand.prototype.draw = function(wall, count) {
			if (!count) {
				count = 1;
			}
			for (var i = 0; i < count; i++) {
				this.add(wall.next());
			};
			this.sort();
		}

		/**
		 *	Adds a specific tile to the hand
		 *
		 */
		Hand.prototype.add = function(tile) {
			this.hand.push(tile);
			this.sort();
			this.lastTile = tile;
		}

		/**
		 *	Removes the first occurance of tile from the hand
		 *	@return true if removed, false otherwise
		 */
		Hand.prototype.remove = function(tile) {
			var index = this.hand.indexOf(tile);
			if (index < 0) {
				return false;
			}
			this.hand.splice(index, 1);
		}

		/**
		 *	Sorts the tiles currently in the hand
		 *
		 */
		Hand.prototype.sort = function() {
			this.hand.sort(function(a, b) {
				return a - b;
			});
		}

		/**
		 *	Gets the tile at the specific index
		 *
		 */
		Hand.prototype.get = function(i) {
			return this.hand[i];
		}

		/**
		 *	Returns a string representation of the hand
		 *
		 */
		Hand.prototype.toString = function() {
			var output = [];
			for (var i = 0; i < this.hand.length; i++) {
				var tileNumber = this.hand[i];
				output.push(util.getTileNumber(tileNumber) + util.getTileSuitLetter(tileNumber));
			};
			return output.join(" ");
		}

		/**
		 *	Returns the compressed form of the hand
		 *
		 */
		Hand.prototype.shortForm = function() {
			var string = this.toString().replace(/\s/g, "")
				.replace(/\d(m|p|s|z)(\d\1)*/g, "$&:")
				.replace(/(m|p|s|z)([^:])/g, "$2")
				.replace(/:/g, "");
			return string;
		}

		/**
		 *	Returns a string representation that is valid javascript
		 *
		 */
		Hand.prototype.toReprString = function() {
			return "new mj.Hand([" + this.hand.join(", ") + "])";
		}

		/**
		 *	Gets a copy of the current tile array
		 *
		 */
		Hand.prototype.getTiles = function() {
			return this.hand.slice(0);
		}

		/**
		 *	Creates a DOM Element with the representation of this hand
		 *
		 */
		Hand.prototype.toTileCollection = function($) {
			var wall = $('<div class="tile-collection">');
			var lastDrawnTile = null;
			for (var i = 0; i < this.hand.length; i++) {
				var tile = this.hand[i];
				if (lastDrawnTile === null && tile == this.lastTile) { // Store up the last added tile
					lastDrawnTile = tile;
					continue;
				}
				wall.append(util.getTileImage($, tile));
			}
			wall.append(util.getTileImage($, lastDrawnTile));
			return wall;
		}

		/**
		 *	Gets a tally that contains all the tiles not in this hand
		 *
		 */
		Hand.prototype.getNotInTally = function() {
			var tally = new mj.TileTally();
			for (var i = 0; i < this.hand.length; i++) {
				tally.remove(this.hand[i]);
			};
			return tally;
		};
		return Hand;
	}());

	var ShantenCalc = (function() {
		/**
		 *	Creates a new shanten calculator
		 *
		 */
		function ShantenCalc(hand) {
			this.hand = hand;
			this.tiles = this.to34Array(hand.getTiles());
			this.calculated = false;

			this.chis = 0;
			this.middles = 0;
			this.twosides = 0;
			this.pons = 0;
			this.pairs = 0;
			this.singles = 0;
		}

		/**
		 *	Converts from an array of values to an indexed array with totals
		 *
		 */
		ShantenCalc.prototype.to34Array = function(hand) {
			var tiles = [];
			for (var i = 0; i < TYPES_OF_TILES; i++) {
				tiles.push(0);
			};
			for (var i = 0; i < hand.length; i++) {
				tiles[hand[i]]++;
			};
			return tiles;
		}

		/**
		 *	Once we have consumed all the tiles in the array
		 *	Calculate the shanten
		 */
		ShantenCalc.prototype.checkShanten = function() {
			var pairs = this.pairs;
			var shanten = 7;
			if (pairs == 0) { // Use one pair for eye
				shanten++;
			} else {
				pairs--;
			}
			// How many complete melds are there
			var complete = this.chis + this.pons;
			shanten -= complete * 2; // Counts for 2
			// How many melds are missing 1 tile
			var missingOne = pairs + this.middles + this.twosides;
			// Can't subtract off more than 4 total melds
			missingOne = Math.min(4 - complete, missingOne);
			shanten -= missingOne; // Counts for 1

			if (shanten < this.shanten) {
				this.shanten = shanten;
				this.shape = {
					chis: this.chis,
					pons: this.pons,
					pairs: this.pairs,
					middles: this.middles,
					twosides: this.twosides,
				};
			}
		}

		/**
		 *	Special case for when we are doing honor tiles
		 *
		 */
		ShantenCalc.prototype.processHonors = function(i) {
			var t = this.tiles;
			switch (t[i]) {
				case 4:
					this.doPon(i, 1);
					this.process(i + 1);
					this.doPon(i, -1);
					this.doPair(i, 1);
					this.process(i + 1);
					this.doPair(i, -1);
					break;
				case 3:
					this.doPon(i, 1);
					this.process(i + 1);
					this.doPon(i, -1);
					this.doPair(i, 1);
					this.process(i + 1);
					this.doPair(i, -1);
					break;
				case 2:
					this.doPair(i, 1);
					this.process(i + 1);
					this.doPair(i, -1);
					break;
				case 1:
					this.doSingle(i, 1);
					this.process(i + 1);
					this.doSingle(i, -1);
					break;
				case 0:
					this.process(i + 1);
					break;
				default:
					throw new Error("Invalid number of tiles " + t[i]);
			}
		}
		/**
		 *	Processes the ith tileNumber
		 *
		 */
		ShantenCalc.prototype.process = function(i) {
			var t = this.tiles;
			while (t[i] == 0) {
				i++;
			}
			var number = util.getTileNumber(i);
			var suit = util.getTileSuit(i);
			// Skip 0 tiles
			if (i >= TYPES_OF_TILES) {
				this.checkShanten(i);
				return;
			}
			if (suit == HONORS) {
				this.processHonors(i);
				return;
			}
			switch (t[i]) {
				case 4:
					this.doPon(i, 1);
					if (number <= 7 && t[i + 2]) {
						if (t[i + 1]) {
							this.doChi(i, 1);
							this.process(i + 1);
							this.doChi(i, -1);
						}
						this.doMiddle(i, 1);
						this.process(i + 1);
						this.doMiddle(i, -1);
					}
					if (number <= 8 && t[i + 1]) {
						this.doTwoSide(i, 1);
						this.process(i + 1);
						this.doTwoSide(i, -1);
					}
					this.doSingle(i, 1);
					this.process(i + 1);
					this.doSingle(i, -1);
					this.doPon(i, -1);

					this.doPair(i, 1);
					if (number <= 7 && t[i + 2]) {
						if (t[i + 1]) {
							this.doChi(i, 1);
							this.process(i);
							this.doChi(i, -1);
						}
						this.doMiddle(i, 1);
						this.process(i + 1);
						this.doMiddle(i, -1);
					}
					if (number <= 8 && t[i + 1]) {
						this.doTwoSide(i, 1);
						this.process(i + 1);
						this.doTwoSide(i, -1);
					}
					this.doPair(i, -1);
					break;
				case 3:

					this.doPon(i, 1);
					this.process(i + 1);
					this.doPon(i, -1);

					this.doPair(i, 1);
					if (number <= 7 && t[i + 1] && t[i + 2]) {
						this.doChi(i, 1);
						this.process(i + 1);
						this.doChi(i, -1);
					} else {
						if (number <= 7 && t[i + 2]) {
							this.doMiddle(i, 1);
							this.process(i + 1);
							this.doMiddle(i, -1);
						}
						if (number <= 8 && t[i + 1]) {
							this.doTwoSide(i, 1);
							this.process(i + 1);
							this.doTwoSide(i, -1);
						}
					}
					this.doPair(i, -1);

					if (number <= 7 && t[i + 2] >= 2 && t[i + 1] >= 2) {
						this.doChi(i, 1);
						this.doChi(i, 1);
						this.process(i);
						this.doChi(i, -1);
						this.doChi(i, -1);
					}
					break;
				case 2:

					this.doPair(i, 1);
					this.process(i + 1);
					this.doPair(i, -1);

					if (number <= 7 && t[i + 2] && t[i + 1]) {
						this.doChi(i, 1);
						this.process(i);
						this.doChi(i, -1);
					}
					break;
				case 1:
					if (number <= 6 && t[i + 1] == 1 && t[i + 2] && t[i + 3] != 4) {
						this.doChi(i, 1);
						this.process(i + 2);
						this.doChi(i, -1);
					} else {
						//	if (n_single<=8) this.doSingle(i, 1); this.process(i+1); this.doSingle(i, -1);
						this.doSingle(i, 1);
						this.process(i + 1);
						this.doSingle(i, -1);

						if (number <= 7 && t[i + 2]) {
							if (t[i + 1]) {
								this.doChi(i, 1);
								this.process(i + 1);
								this.doChi(i, -1);
							}
							this.doMiddle(i, 1);
							this.process(i + 1);
							this.doMiddle(i, -1);
						}
						if (number <= 8 && t[i + 1]) {
							this.doTwoSide(i, 1);
							this.process(i + 1);
							this.doTwoSide(i, -1);
						}
					}
					break;
				case 0:
					this.process(i + 1);
					break;
				default:
					throw new Error("Invalid number of tiles " + t[i]);
			}
		}

		/**
		 *	The following functions check if a meld is possible
		 *	If it is remove a set of tiles starting at i
		 *	Corresponding to what kind of meld it is, also adds or subtracts the types from the total
		 *	Returns true if removed, false if not possible
		 *	@param i The index to start at
		 *	@param p 1 for add to the counter, -1 for remove
		 */
		ShantenCalc.prototype.doChi = function(i, p) {
			this.tiles[i] -= p;
			this.tiles[i + 1] -= p;
			this.tiles[i + 2] -= p;
			this.chis += p;
		}
		ShantenCalc.prototype.doMiddle = function(i, p) {
			this.tiles[i] -= p;
			this.tiles[i + 2] -= p;
			this.middles += p;
		}
		ShantenCalc.prototype.doTwoSide = function(i, p) {
			this.tiles[i] -= p;
			this.tiles[i + 1] -= p;
			this.twosides += p;
		}
		ShantenCalc.prototype.doPon = function(i, p) {
			this.tiles[i] -= 3 * p;
			this.pons += p;
		}
		ShantenCalc.prototype.doPair = function(i, p) {
			this.tiles[i] -= 2 * p;
			this.pairs += p;
		}
		ShantenCalc.prototype.doSingle = function(i, p) {
			this.tiles[i] -= p;
			this.singles += p;
		}

		/**
		 *	Runs the actual calculation
		 *
		 */
		ShantenCalc.prototype.calculate = function() {
			this.shanten = 10;
			this.checkSpecial();
			this.process(0);
			this.calculated = true;
		}

		/**
		 *	Checks for chitoi and kokushi
		 *
		 */
		ShantenCalc.prototype.checkSpecial = function() {
			var pairs = 0;
			var singles = 0;
			for (var i = 0; i < TYPES_OF_TILES; i++) {
				if (this.tiles[i]) {
					singles++;
					if (this.tiles[i] >= 2) {
						pairs++;
					}
				}
			}
			var shanten = 6 - pairs;
			shanten += Math.max(7 - pairs - singles, 0);
			this.chitoiShanten = shanten;
			if (shanten < this.shanten) {
				this.shanten = shanten;
			}
			var terminals = 0;
			var hasPair = false;
			for (var i = 0; i < TYPES_OF_TILES; i++) {
				var number = util.getTileNumber(i);
				var suit = util.getTileSuit(i);
				if (number != 1 && number != 9 && suit != HONORS) {
					continue;
				}
				if (this.tiles[i]) {
					terminals++;
					if (this.tiles[i] >= 2) {
						hasPair = true;
					}
				}
			}
			shanten = 13 - terminals;
			if (hasPair) {
				shanten -= 1;
			}
			this.kokushiShanten = shanten;
			if (shanten < this.shanten) {
				this.shanten = shanten;
			}
		}


		/**
		 *	Gets the shanten
		 *
		 */
		ShantenCalc.prototype.get = function() {
			if (!this.calculated) {
				this.calculate();
			}
			return this.shanten;
		}

		/**
		 *	Prints out debug information
		 *
		 */
		ShantenCalc.prototype.debug = function() {
			console.log("Shanten for hand " + this.hand.toString());
			console.log("Shanten = " + this.get());
			console.log("KokushiShanten = " + this.kokushiShanten);
			console.log("ChitoiShanten = " + this.chitoiShanten);
			console.log(this.shape);
		}
		return ShantenCalc;
	}());

	var TileTally = (function() {
		/**
		 *	Creates a new tile tally initialized with all tiles available
		 *
		 */
		function TileTally() {
			this.tally = [];
			for (var i = 0; i < TYPES_OF_TILES; i++) {
				this.tally.push(NUMBER_SAME_TILES);
			};
		}
		/**
		 *	Removes the given tile from the tally
		 *
		 */
		TileTally.prototype.remove = function(i) {
			if (this.tally[i] < 1) {
				throw new Error("Error, trying to remove " + i + " would go below 0");
			}
			this.tally[i]--;
		};
		/**
		 *	dos a tile
		 *
		 */
		TileTally.prototype.add = function(i) {
			if (this.tally[i] >= NUMBER_SAME_TILES) {
				throw new Error("Error, trying to add " + i + " would go above 4");
			}
			this.tally[i]++;
		};

		/**
		 *	Returns the number of tiles in the tally that are in the tileSet
		 *
		 */
		TileTally.prototype.count = function(tileSet) {
			var total = 0;
			for (var i = 0; i < TYPES_OF_TILES; i++) {
				total += this.tally[i] * tileSet.contains(i);
			}
			return total;
		}
		return TileTally;
	}());

	var TileSet = (function() {
		/**
		 *	TileSet is a set of tiles, no duplicates and each tile is either in or not in the set
		 *	Initially no tiles are in the set
		 */
		function TileSet() {
			this.set = [];
			for (var i = 0; i < TYPES_OF_TILES; i++) {
				this.set.push(0);
			}
		}

		/**
		 *	Removes a tile from the set
		 *
		 */
		TileSet.prototype.remove = function(i) {
			this.set[i] = 0;
		};

		/**
		 *	Adds a tile to the set
		 *
		 */
		TileSet.prototype.add = function(i) {
			this.set[i] = 1;
		};

		/**
		 *	Checks whether the set contains this tile
		 *	@return 1 for yes, 0 for no
		 */
		TileSet.prototype.contains = function(i) {
			return this.set[i];
		}

		/**
		 *	Returns a list of tiles in this set
		 *	@return An array of tiles
		 */
		TileSet.prototype.getTiles = function() {
			var output = [];
			for (var i = 0; i < TYPES_OF_TILES; i++) {
				if (this.contains(i)) {
					output.push(i);
				}
			};
			return output;
		}

		return TileSet;
	}());

	var DiscardOptimizer = (function() {
		/**
		 *	Creates a new discard optimizer
		 *	@param hand Hand with 14 tiles
		 */
		function DiscardOptimizer(hand) {
			this.hand = new mj.Hand(hand.getTiles());
			this.calculated = false;
		}

		/**
		 *	Calculates the best discard
		 *
		 */
		DiscardOptimizer.prototype.calculate = function() {
			var hand = this.hand;

			var currentShanten = new mj.ShantenCalc(hand).get();

			var tiles = hand.getTiles();
			var lastTile = -1;
			var discards = {};
			for (var i = 0; i < tiles.length; i++) {
				var tile = tiles[i];
				if (tile == lastTile) {
					continue;
				}
				lastTile = tile;
				hand.remove(tile);
				discards[tile] = this.getImprovingTiles(currentShanten, hand);
				hand.add(tile);
			};

			this.discards = discards;
			this.calculated = true;
		};

		/**
		 *	Gets the result of the calculation, calculates if not calculated
		 *	@return map of tile to tileset
		 */
		DiscardOptimizer.prototype.get = function() {
			if (!this.calculated) {
				this.calculate();
			}
			return this.discards;
		};

		/**
		 *	Given a hand, figures out what tiles will improve it
		 *	@param hand The hand
		 *	@return A tileset containing the tiles that improve it
		 */
		DiscardOptimizer.prototype.getImprovingTiles = function(currentShanten, hand) {
			var tileSet = new mj.TileSet();
			for (var i = 0; i < TYPES_OF_TILES; i++) {
				hand.add(i);
				var newShanten = new mj.ShantenCalc(hand).get();
				// console.log(newShanten, currentShanten, i); 
				if (newShanten < currentShanten) {
					tileSet.add(i);
				}
				hand.remove(i);
			}
			return tileSet;
		}
		return DiscardOptimizer;
	}());

	var DiscardSorter = (function() {
		/**
		 *	Creates a new discard sorter from the results of a DiscardOptimizer	and a tileTally
		 *	@param discards The results from DiscardOptimizer.get()
		 *	@param tileTally The tile tally to calculate number of tiles from
		 */
		function DiscardSorter(discards, tileTally) {
			this.discards = discards;
			this.tileTally = tileTally;
			this.results = [];
		}

		/**
		 *	Calculates and sorts
		 *
		 */
		DiscardSorter.prototype.calculate = function() {
			for (var tile in this.discards) {
				if (!this.discards.hasOwnProperty(tile)) {
					continue;
				}
				var tileSet = this.discards[tile];
				var result = {};
				result.discard = tile;
				result.score = this.tileTally.count(tileSet);
				if (result.score == 0) {
					continue;
				}
				result.tiles = tileSet.getTiles();
				this.results.push(result);
			}

			this.results.sort(function(a, b) {
				return b.score - a.score;
			});

			this.calculated = true;
		};

		/**
		 *	Gets the results, calculates if needed
		 *
		 */
		DiscardSorter.prototype.get = function() {
			if (!this.calculated) {
				this.calculate();
			}
			return this.results;
		};

		/**
		 *	Converts a single entry from DiscardSorter.get() into dom elements for displaying
		 *	@param $ jQuery like object
		 *	@param entry A row from DiscardSorter.get()
		 */
		DiscardSorter.toTileCollection = function($, entry) {
			var container = $('<div class="discard-sorter-entry">');
			$(util.getTileImage($, entry.discard)).appendTo(container);
			$('<span class="tile-count">').text(entry.score).appendTo(container);
			var tileList = $('<span class="improving-tiles">').appendTo(container);
			for (var i = 0; i < entry.tiles.length; i++) {
				tileList.append(util.getTileImage($, entry.tiles[i]));
			}
			return container;
		}
		return DiscardSorter;
	}());

	return {
		Wall: Wall,
		Hand: Hand,
		ShantenCalc: ShantenCalc,
		TileTally: TileTally,
		TileSet: TileSet,
		DiscardOptimizer: DiscardOptimizer,
		DiscardSorter: DiscardSorter,
		util: util,
	};
}());

jQuery(function($) {

	var hand;
	var optimizer;
	var sorter;
	var results;
	var selectedTile = null;
	var currentWall = null;

	// Get a new hand
	function resetRound() {
		hand = new mj.Hand();
		currentWall = new mj.Wall();
		hand.draw(currentWall, 14);
		nextRound();
	}
	$('.new-hand-button').on('click', resetRound);

	// Draw the next tile
	function continueRound() {
		hand.remove(selectedTile);
		hand.draw(currentWall);
		nextRound();
	}
	$('.draw-button').on('click', continueRound);

	function customHand(e) {
		e.preventDefault();
		hand = mj.util.getHandFromString($('.hand-output').val());
		nextRound();
	}
	$('.input-hand').on('submit', customHand);

	function nextRound() {
		selectedTile = null;
		$('.discards').empty().hide();
		$('.start-message').show();
		$('.correct-message').hide();
		$('.incorrect-message').hide();
		$('.draw-button').attr('disabled', true);

		$('.hand-output').val(hand.shortForm());
		console.time("shanten");
		var calc = new mj.ShantenCalc(hand);
		calc.debug();
		$('.shanten').text(calc.get());
		console.timeEnd("shanten");
		var images = hand.toTileCollection($);
		$('.tiles').empty().append(images);


		console.time("discards");
		optimizer = new mj.DiscardOptimizer(hand);
		sorter = new mj.DiscardSorter(optimizer.get(), hand.getNotInTally());
		results = sorter.get();
		var container = $('.discards');
		for (var i = 0; i < results.length; i++) {
			container.append(mj.DiscardSorter.toTileCollection($, results[i]));
		};
		console.timeEnd("discards");
	}

	function selectTile() {
		if (selectedTile !== null) {
			return;
		}
		var ele = $(this);
		selectedTile = ele.data('tile');
		updateCorrect();
	}
	$('.tiles').delegate('img', 'click', selectTile);

	function updateCorrect() {
		var best = results[0].score;
		var correct = false;
		for (var i = 0; i < results.length; i++) {
			if (selectedTile == results[i].discard && best == results[i].score) {
				correct = true;
				break
			}
		}
		$('.start-message').hide();
		$('.discards').show();
		if (correct) {
			$('.correct-message').show();
		} else {
			$('.incorrect-message').show();
		}
		$('.draw-button').attr('disabled', false);
	}

	resetRound();
});

