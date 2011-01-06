/*Takes a text presumed to contain a mixture of text properly marked up for use in the editor, and plain xml pasted in. Attempts to make the
 *plain xml adhere to the editor's expectations by:
 *Finding the plain xml by searching for the first < that is NOT part of a span tag
 *DONE-From that point forward, change all < and > to &lt; and &gt;
 *DONE-add a <span class=tag"> </span> to wrap around each &lt;xxx&gt;&lt;/xxx&gt; or &lt;xxx/&gt
 *
 *TODO-Change \n to <br>
 *
 *More to come as need arrises
 **/
function fixMarkup(text)
{

    var tagBeginnings=text.split( "<" );
    var inBadSection=false;
    var newText="";
    for(i=1;i<tagBeginnings.length;i++)
    {
        if(!inBadSection)
        {
            //find the first open bracket that is not connected to a span tag, this is the beginning of incorrectly formatted text
            if(tagBeginnings[i].substring(0, 4)!='span' && tagBeginnings[i].substring(0, 5)!='/span')
            {
                inBadSection=true;
            }
            else
            {
                newText+="<"+tagBeginnings[i];
            }
        }
        //If we are in the section with plain xml tags, begin by adding &lt; ad the beggining (the < was lost in the tokenizing) and repacing the first > with &gt;
        if(inBadSection)
        {
            var tmpString=tagBeginnings[i];
            var isClosingTag=false;
            var isOpeningTag=false;
            var slashPosition=tmpString.indexOf('/');
            var closeBracketPosition=tmpString.indexOf('>');
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
                    if(slashPosition<closeBracketPosition)
                    {
                        isOpeningTag=true;
                    }
                }
                if(isOpeningTag)
                {
                    if(isClosingTag)
                    {
                        tmpString=tmpString.replace('>','&gt;</span>');
                    }
                    else
                    {
                        tmpString=tmpString.replace('>','&gt;');
                    }
                    tmpString='<span class="tag">&lt;'+tmpString;
                }
                else
                {
                    if(isClosingTag)
                    {
                        tmpString=tmpString.replace('>','&gt;</span>');
                    }
                    else
                    {
                        tmpString=tmpString.replace('>','&gt;');
                    }
                    tmpString='&lt;'+tmpString;
                }

            }
            newText+=tmpString;
        }
    }
    return newText;
}