/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package xmlEditor;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.InputStreamReader;
import java.io.Reader;

/**
 *
 * @author jdeerin1
 */
public class textFetcher {
    /**Reads a text file as UTF-8 encoded text and returns a string with the contents*/
public static String readFileAsString(String filePath)
    throws java.io.IOException
        {
        StringBuffer fileData = new StringBuffer(1000);
        char[] buf = new char[1024];
        int numRead=0;
        Reader in = new InputStreamReader(new FileInputStream(filePath), "UTF-8");

        while((numRead=in.read(buf)) != -1){
            String readData = String.valueOf(buf, 0, numRead);
            fileData.append(readData);
            buf = new char[1024];
        }
        in.close();
        return fileData.toString();
    }

}
