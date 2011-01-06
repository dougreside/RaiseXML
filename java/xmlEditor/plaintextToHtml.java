/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package xmlEditor;

import com.google.gson.Gson;
import java.io.IOException;
import java.io.PrintWriter;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.owasp.esapi.ESAPI;

/**
 *
 * @author jdeerin1
 */
public class plaintextToHtml extends HttpServlet {
   
    /** 
     *use ESAPI to convert plaintext to html entities int the provided JSON string  and return it as a JSON string
     */
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
    throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        try {
                       if(request.getParameter("text")==null)
                response.sendError(response.SC_EXPECTATION_FAILED);
            Gson gson = new Gson();
            String toret=gson.fromJson(request.getParameter("text"),String.class);
            //String toret="<title>\n\"Tom & Jerry's Revenge\"--A Tragedy\n</title>";
            
            toret=ESAPI.encoder().encodeForHTML(toret);
            toret=toret.replace("&#xa;", "<br>");
            out.print(gson.toJson(toret));
            //out.print(toret);
        } finally { 
            out.close();
        }
    } 

    // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
    /** 
     * Handles the HTTP <code>GET</code> method.
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
    throws ServletException, IOException {
        processRequest(request, response);
    } 

    /** 
     * Handles the HTTP <code>POST</code> method.
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
    throws ServletException, IOException {
        processRequest(request, response);
    }

    /** 
     * Returns a short description of the servlet.
     * @return a String containing servlet description
     */
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>

}
