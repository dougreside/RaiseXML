AutoSuggest = function(){
			this.possible = [];
			this.history=[];
			this.typed = "";
			this.curOpt = 0;
			this.menuOpen = false;
		};
	AutoSuggest.constructor = AutoSuggest;
	AutoSuggest.prototype = {};
	$.extend(AutoSuggest.prototype, {
		setPossible:function(possArray){
			this.possible = possArray;
			this.history = [];
		
		},
		narrowPossible:function(){
			self = this;
			self.curOpt=0;
			this.history.push(this.possible);
			this.possible = _.select(this.possible,function(i){if (i.substring(0,self.typed.length)==self.typed){return i;}}); 
			return this.possible;
		},
		backPossible: function(){
			this.possible = this.history.pop();
		},
		getPossible: function(){
			return this.possible;
		},
		showSuggest: function(list,posId){
            	if (list.length > 0) {
					listHTML = "<ul class='autoSugList'>";
					for (var i = 0; i < list.length; i++) {
						listHTML = listHTML + "<li>" + list[i] + "</li>"
					}
					listHTML = listHTML + "</ul>";
					var asx = $("#" + posId).offset().left;
					var asy = $("#" + posId).offset().top;
					
					lh = parseFloat($("#" + posId).css("line-height"));
					asy = asy + lh;
					$("#autoSuggest").show();
					$("#autoSuggest").offset({
						left: asx,
						top: asy
					});
					$("#autoSuggest").html(listHTML);
					this.menuOpen = true;
					this.highlightCurrentListTag();
				}
				else{
					this.hideSuggest();
				}
            },
		hideSuggest: function(){
			this.menuOpen=false;
			$("#autoSuggest").html("");
			$("#autoSuggest").hide();
		},
		highlightCurrentListTag:function(){
		
			if (this.menuOpen){
			
				$(".SelectedAutoSuggestItem").removeClass("SelectedAutoSuggestItem");
				var curLine = $(".autoSugList>li:eq("+this.curOpt+")");
				if (curLine.size()>0) {
					curLine.addClass("SelectedAutoSuggestItem");
					newScrollPos = parseFloat(curLine.position().top) + parseFloat($("#autoSuggest").scrollTop());
					$("#autoSuggest").scrollTop(newScrollPos);
						
				}
			}
		
		},
		menuDown:function(){
			var num = $(".autoSugList>li").size();
		
			this.curOpt++;
			if (num==this.curOpt){
				this.curOpt = 0;
			}
			
			this.highlightCurrentListTag();
		},
		menuUp:function(){
			var num = $(".autoSugList>li").size();
		
			this.curOpt--;
			if (this.curOpt==-1){
				this.curOpt = num-1;;
			}
			this.highlightCurrentListTag();
		},
		getCurrent:function(){
			var curText = $(".autoSugList>li:eq("+this.curOpt+")").html();
			return curText;
		}
		
	});