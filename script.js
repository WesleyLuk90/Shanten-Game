

jQuery(function($) {

	window.applicationCache.addEventListener('error', function(){
		console.log('error');
	});
	window.applicationCache.addEventListener('checking', function(){
		console.log('checking');
	});
	window.applicationCache.addEventListener('progress', function(){
		console.log('progress');
	});
	window.applicationCache.addEventListener('downloading', function(){
		console.log('downloading');
	});
	window.applicationCache.addEventListener('updateready', function(){
		console.log('updateready');
	});
	window.applicationCache.addEventListener('noupdate', function(){
		console.log('noupdate');
	});

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
		// calc.debug();
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