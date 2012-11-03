/****************************************/
/*************typeableSelect*************/
/****************************************/
/* a jquery plugin that allows the user */
/*  to enter custom text in a dropdown  */
/****************************************/

(function($) {
$.fn.cleanWhitespace = function() {
	var i = 0;
	textNodes = this.contents()
		.filter(function() {
			return (this.nodeType == 3 && !/\S/.test(this.nodeValue));
		}).each(function() {
			if(i == 0) {
				$(this).remove();
				i++;
			}
		})
	;

	return this;
}

$.fn.typableSelect = function(user_defined_onchange) {
	//functions used by typable
	var typable_close_list = function() {
		if(input.val() == '') {
			list.scrollTop(0);
		}

		list.hide();
		button.removeClass('selected');
	},

	typable_open_list = function() {
		list.show().focus();
		button.addClass('typable selected');

		var set_selected = false;

		//highlight the currently selected list option
		list.find('li').each(function() {
			if($(this).text() == input.val()) {
				set_selected = true;

				$(this).addClass('selected');	//highlight the item and
				scroll_to_selected();		//scroll to it if necessary
			}
		});

		if(!set_selected) {
			list.scrollTop(0);
			list.children(':first').addClass('selected');
		}
	},

	typable_toggle_list = function() {
		if(list.is(':hidden')) {
			typable_open_list();
		} else {
			typable_close_list();
		}
	},

	scroll_to_selected = function(key_pressed) {
		var	selected  = list.children('li.selected').first(),
			list_top  = list.scrollTop(),
			scroll_by = 0
		;

		if(!is_visible_in_list(selected)) {
			if(!key_pressed) {
				scroll_by = selected.position().top;
			} else if(selected.position().top > 0) {
				scroll_by = get_full_height(selected);
			} else {
				scroll_by = -get_full_height(selected);
			}

			list.scrollTop(list_top + scroll_by);
		}
	},

	set_input = function(list_option) {
		input.val(list_option.text());
		real_input.val(list_option.attr('id'));
		user_defined_onchange();
	},

	get_full_height = function(elm) {
		return	elm.height() + parseInt(elm.css('marginTop'), 10) + parseInt(elm.css('marginBottom'), 10) +
			parseInt(elm.css('paddingTop'), 10) + parseInt(elm.css('paddingBottom'), 10);
	},

	is_visible_in_list = function(elm) {
		var	list_top	= 0,
			list_bottom	= list.height(),
			elm_top		= elm.position().top,
			elm_bottom	= elm_top + elm.height() + parseInt(elm.css('paddingTop'), 10) +
					  parseInt(elm.css('paddingBottom'), 10)
		;

		return ((elm_bottom <= list_bottom) && (elm_top >= list_top));
	};
	//end function declarations


	var	id		= this.attr('id'),
		container	= this.parent(),	
		options		= this.children('option').toArray(),
		select_class	= this.attr('class'),
		prev_sibling	= this.get(0).previousSibling
	;

	//fix for ie7 - removes an extra space that may be added before the <select>
	if(prev_sibling.nodeType == 3) {
		$(prev_sibling).remove();
	}

	//remove the old dropdown
	this.remove();

	//create a span to hold the typable and insert it in place of the old dropdown
	var typable = $('<span id="' + id + '_typable" class="typable">&nbsp;</span>');
	container.append(typable);

	//create the typable input box
	var input = $('<input type="text" id="' + id + '" class="typable ' + select_class + '" maxlength="100" />')
		.focus(typable_close_list)
		.keydown(function(e) {
			if(e.keyCode == 38 || e.keyCode == 40) {	//open the list when down is pressed
				e.preventDefault();
				typable_open_list();
			}
		})
		.keyup(user_defined_onchange)
	;
	typable.append(input);

	//create an invisible input with the same id as the original dropdown to hold the actual option values
	var real_input = $('<input type="hidden" id="' + id + '_input"  maxlength="100" />');
	typable.append(real_input);

	//create the dropdown toggle button
	var button = $('<button id="' + id + '_button" class="typable">&nbsp;</button>')
		.click(typable_toggle_list)
		.keydown(function(e) {
			if(e.keyCode == 38 || e.keyCode == 40) {	//open the list when down is pressed
				e.preventDefault();
				typable_open_list();
			}
		})
	;
	typable.append(button);


	var list_width	 = typable.width() - 2;				//account for the input box's border
	var input_height = input.height() - 7;

	var list = $('<ul id="' + id + '_options" class="typable"></ul>')
		.css('display', 'none')
		.css('width', list_width)
		.css('top', input_height)
		.on('click', 'li', function() {
			//set the input box's value to the clicked option's name
			set_input($(this));
			typable_close_list();
			button.focus();
		})
		.on('mouseenter', 'li', function() {
			$(this).siblings('li').removeClass('selected');
			$(this).addClass('selected');	
		})
		.keydown(function(e) {
			e.preventDefault();

			var selected = $(this).children('li.selected').first();

			if(e.keyCode == 13) {							//enter was pressed
				typable_close_list();
				set_input(selected);
				button.focus();
			} else if(e.keyCode == 27) {						//escape was pressed
				typable_close_list();
				button.focus();
			} else if(e.keyCode == 40) {						//down was pressed
				//don't move the selector if we're on the last item in the list
				if(!selected.is('li:last')) {
					var next = selected.next();

					selected.removeClass('selected');
					next.addClass('selected');

					//scroll the list if the last item showing is selected
					scroll_to_selected(true);
					set_input(next);
				}
			} else if(e.keyCode == 38) {						//up was pressed
				//don't move the selector if we're on the first item in the list
				if(!selected.is('li:first')) {
					var prev = selected.prev();

					selected.removeClass('selected');
					prev.addClass('selected');

					//scroll the list if the last item showing is selected
					scroll_to_selected(true);
					set_input(prev);
				}
			} else {								//another key was pressed
				//check if an option in the list starts with the character that was pressed
				var char = String.fromCharCode(e.keyCode);
				test1(char);
			}
		})
	;
	typable.append(list);

	var key_search = '';
	var key_timer = 900;	//milliseconds allowed between keystrokes before starting a new search
	var key_timeout = null;

	var test1 = function(key_char) {
		var found_match = false;

		key_search += key_char.toLowerCase();

		list.find('li').each(function() {
			if($(this).text().toLowerCase().substr(0, key_search.length) == key_search) {
				found_match = true;

				$(this).siblings('li').removeClass('selected');		//remove all other selected classes

				$(this).addClass('selected');	//highlight the item and
				scroll_to_selected();		//scroll to it if necessary

				set_input($(this));		//put the item into the input

				clearTimeout(key_timeout);	//clear the old timeout so it won't override the new one
				key_timeout = setTimeout(	//create the new timeout
					function() {
						key_search = '';
					},
					key_timer
				);

				return false;
			}
		});
		if(!found_match) { key_search = ''; }
	};

	//create the new list of options and add each of the dropdown's options to it
	var option_string = '';
	$.each(options, function() {
		option_string += '<li id="' + $(this).val() + '" class="typable">' + $(this).text() + '</li>';
	});
	list.append(option_string);

	//close the typable when the user clicks outside it
	$(document).click(function(e) {
		if(!$(e.target).hasClass('typable')) {
			typable_close_list();
		}
	});

	return this;
};
})(jQuery);

