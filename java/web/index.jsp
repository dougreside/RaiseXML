<%-- 
    Document   : index
    Created on : Jan 4, 2011, 10:28:31 AM
    Author     : jdeerin1
--%>

<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
   "http://www.w3.org/TR/html4/loose.dtd">
<%@page import ="com.google.gson.Gson"%>
<%@page import ="xmlEditor.textFetcher"%>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>JSP Page</title>
        <script>
            function rep()
            {
                
              var val=  document.getElementById('text').value;
              val=val.replace(new RegExp(document.getElementById('regex').value,'g'),document.getElementById('with').value);
                  //val=val.replace(/>/g,'&gt;');
                   document.getElementById('text').value=val;
            }
            </script>
    </head>
    <body>
        <form action="validate" method="post">
            <textarea cols="120" rows="30" name="text" id="text">
<%
String url="http://archimedespalimpsest.net/Supplemental/ArchimedesTranscriptions/MeasurmentOfTheCircle/MeasurementCircle-NW-p5.xml";
Gson gson = new Gson();
String jsonText=gson.toJson(textFetcher.readFileAsString("/usr/web/MeasurementCircle-NW-p5.xml"));
out.print(jsonText);
%>
            </textarea><br>
            <input type="submit" value="test tei-all validation"/>
        </form>
            <form action="downloadXML" method="post">
            <textarea cols="120" rows="30" name="text" id="text">
<%


out.print(jsonText);
%>
            </textarea><br>
            <input type="submit" value="test xml download"/>
        </form>
        <!--<button onclick="rep();">Replace angle brackets</button>replace<input type="text" id="regex"> with <input type="text" id="with">-->
        <form action="htmlToPlaintext" method="post">
            <textarea id="text" name="text">"\u0026lt;title\u0026gt;\u003cbr\u003e\u0026quot;Tom \u0026amp; Jerry\u0026#x27;s Revenge\u0026quot;--A Tragedy\u003cbr\u003e\u0026lt;\u0026#x2f;title\u0026gt;"</textarea>
            <input type="submit" value="Test html to plaintext">
        </form>
        <form action="plaintextToHtml" method="post">
            <textarea id="text" name="text">""\u003ctitle\u003e\n\"Tom \u0026 Jerry\u0027s Revenge\"--A Tragedy\n\u003c/title\u003e""</textarea>
            <input type="submit" value="Test plaintext to html">
        </form>

    </body>
</html>
