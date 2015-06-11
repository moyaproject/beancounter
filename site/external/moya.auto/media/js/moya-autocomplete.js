(function($) {

    $.fn.moyaAutocomplete = function(options) {

        var options = options || {};
        var UP=38;
        var DOWN=40;
        var RETURN=13;
        var ESCAPE=27;
        var TAB = 9;
        var cache = {};

        var $this = $(this);

        var rpc_url = $this.data('rpc');
        var field = $this.data('field');
        var params = $this.data('params');
        var completer = $this.data('completer');
        var resultsid = 'results-' + $this.attr('id');
        var max_show = options.max_show || 10;

        var $input = $this.parents('form').find('input[name=' + field + ']');
        $input.attr('autocomplete', 'off');
        var rpc = new JSONRPC(rpc_url);

        $('<div id="' + resultsid + '" class="moya-autocomplete-results" style="display:none;"></div>').insertAfter($input);
        var $results = $this.parents('form').find('#' + resultsid + '.moya-autocomplete-results');
        $results.width($input.outerWidth());

        var selection = -1;
        var max_result = -1;
        var display_search = null;


        function update_dimensions()
        {
            $results.width($input.outerWidth() - 2);
            if($results.is(':visible'))
            {
                if(max_result >= max_show)
                {
                    var height = 0;
                    $results.find('.moya-autocomplete-result').each(function(i, el)
                    {
                        if(i==max_show)
                        {
                            return false;
                        }
                        height += $(el).outerHeight();
                    });
                    var gutter = $results.outerHeight() - $results.innerHeight();
                    height += gutter;
                    $results.css('max-height', height + 'px');
                }
                else
                {
                    $results.css('max-height', 'none');
                }
            }
        }

        function update()
        {
            var input = $input.val();
            var cached = cache[input];

            function on_results(results)
            {
                display_search = results.input;
                max_result = results.count - 1;
                cache[results.input] = results;
                if($input.val() != results.input)
                {
                    return;
                }
                if(results.count)
                {
                    selection = -1;
                    max_result = results.count - 1;
                    $results.html(results.html);
                    if(results.count>=0)
                    {
                        $results.show();
                    }
                    update_dimensions();
                }
                else
                {
                    $results.hide();
                }
            }

            if (cached)
            {
                on_results(cached);
            }
            else
            {
                rpc.call('complete',
                         {input:input,
                          completer:completer,
                          params:params},
                          on_results);
            }
        }

        function refresh_selection()
        {
            if(max_result < 0)
            {
                return;
            }
            $results.find('.selection').removeClass('active');
            if(selection != -1)
            {
                $results.find('.selection-' + selection).addClass('active');
                $results.show();
            }
            update_dimensions();

            var $active = $results.find('.selection.active');
            var row_h = $active.outerHeight();
            var container_h = $results.height();
            var scroll = $results.scrollTop();
            var y = $active.offset().top - $results.offset().top + scroll - 1;

            if (y - scroll + row_h> container_h)
            {
                $results.scrollTop(y - container_h + row_h);
            }
            else if (y - scroll < 0)
            {
                $results.scrollTop(y);
            }
        }

        $input.keyup(function(e){
            if(e.which != UP && e.which != DOWN && e.which != RETURN && e.which != ESCAPE && e.which != TAB)
            {
                update();
            }
        });

        $input.blur(function(e){
            $results.fadeOut('fast');
        });

        $input.focus(function(e){
            if(display_search !== null)
            {
                update_dimensions();
                $results.fadeIn('fast');
            }
        });

        $results.on('click', '.selection', function(e){
            var value = $(this).data('value');
            if(value)
            {
                $input.val(value);
                /*selection = -1; */
                /*display_search = null;*/
            }
        });

        $input.keydown(function(e)
        {
            if(e.which==ESCAPE)
            {
                selection = -1;
                $results.hide();
                e.preventDefault();
            }
            else if (e.which==UP)
            {
                if (selection > 0)
                {
                    selection -= 1;
                    refresh_selection();
                }
                e.preventDefault();
            }
            else if (e.which==DOWN)
            {
                if (selection == -1)
                {
                    selection = 0;
                    refresh_selection();
                }
                else if (selection < max_result)
                {
                    selection += 1;
                    refresh_selection();
                }
                e.preventDefault();
            }
            else if (e.which==RETURN)
            {
                if(!$results.is(':visible'))
                {
                    return;
                }
                $results.hide();
                e.preventDefault();
                if(selection >= 0)
                {
                    var value = $results.find('.selection.active').data('value');
                    if(value)
                    {
                        $input.val(value);
                        selection = -1;
                        display_search = null;
                    }
                }

            }

        });
    }

})(jQuery);