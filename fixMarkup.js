/**
 *Add a <span class=tag> around every xml opening closing or self closing tag that doesnt already have one
 **/
function fixMarkup(text)
{

    var tagBeginnings=text.split( "&lt;" );
    var inBadSection=true;
    var newText="";
    newText=tagBeginnings[0];
    for(i=1;i<tagBeginnings.length;i++)
    {

        //If we are in the section with plain xml tags, begin by adding &lt; ad the beggining (the < was lost in the tokenizing) and repacing the first > with &gt;
        if(inBadSection)
        {
            var tmpString=tagBeginnings[i];
            var isClosingTag=false;
            var isOpeningTag=false;
            var slashPosition=tmpString.indexOf('/');
            var closeBracketPosition=tmpString.indexOf('&gt;');
            //if the slash occurs right before the >, it is a tag like <lb/> which opens and closes, so it needs both treatments
            
            if(slashPosition+1==closeBracketPosition)
            {
                isClosingTag=true;
                isOpeningTag=true;
            }
            else
            {
                //if it has a slash, and didnt meet the prvious criteria, it is a closing tag.
                if(slashPosition>=0 && slashPosition<closeBracketPosition)
                {
                    isClosingTag=true;
                }
                else
                {
                    //If it wasnt any of those, its a plain opening tag.
                    isOpeningTag=true;
                }
            }
            //if this hasnt been previously tagged with a span class="tag", do so
            if(!(tagBeginnings[i-1].endsWith('<span class="tag">')))
            {
                
                    tmpString='<span class="tag">&lt;'+tmpString;
                    tmpString=tmpString.replace('&gt;','&gt;</span>');
                
               
            }
            //this tag was already wrapped in a span, just add the &lt; back
            else
            {
                tmpString="&lt;"+tmpString;
            }
            newText+=tmpString;
        }
    }
    return newText;
}
/**Allow you to check that a string ends with a particular string*/
String.prototype.endsWith = function(str)
{
    return (this.match(str+"$")==str);
}