
		alert("po");
			var shifted =false;
			ts = new TextSelector();
			
			$("body").eq(0).keydown(function(e){
                
					switch (e.charCode) {
						
                    			
                       
                        case 60:
							// <
							window.parent.showMessage("Tag Opened");	
							sel = ts.getSelectedText();
							
							kidlen=$(sel.StartParent).children().length;
							
							output = $("body", d).html();
							start = output.substring(0,sel.StartOffset);
							end = output.substring(sel.StartOffset);
							middle = "<span class='tag'>&lt;</span>";
							node.html(start+middle+end);
                        break;     
						case 62:
							// <
							window.parent.showMessage("Tag Closed");	
                        break;                        
                    }
            
                    
                });	
	