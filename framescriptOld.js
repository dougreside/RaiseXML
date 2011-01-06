$(document).ready(function(){
		alert("po");
			var shifted =false;
			ts = new TextSelector();
			
			$("body").mouseup(function(e){sel = ts.getSelectedText();window.parent.showMessage(JSON.stringify(sel));});
		            $("html").eq(0).keydown(function(e){
                
					switch (e.keyCode) {
						
                        case 16:
						shifted = true;
							// Return 
                          //  Pause();
                           
						break;
                        case 188:
							// <
						
							if (shifted) {
						
							sel = ts.getSelectedText();
							window.parent.showMessage(JSON.stringify(sel));	
							kidlen=$(sel.StartParent).children().length;
							node = null;
							if (kidlen>0){
								node = $(sel.StartParent).children().eq(sel.StartChild);
								}
							else{
								node =  $(sel.StartParent);
							}
							output = node.html();
							start = output.substring(0,sel.StartOffset);
							end = output.substring(sel.StartOffset);
						
							middle = "<span class='tag'>&lt;</span>";
							node.html(start+middle+end);
							
							}
                        break;
                        case 190:
							// <
							if (shifted) {
							
							}
                        break;
                            
                    }
					if (e.keyCode!=16){
						shifted = false;
					}
            
                    
                });	
		});