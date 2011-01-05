package xmlEditor;

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 *
 * @author jdeerin1
 */
import java.io.*;
import javax.xml.XMLConstants;
import javax.xml.transform.Source;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.*;
import org.xml.sax.SAXException;

public class validator{

    public static String validate(String text) throws SAXException, IOException {

        String fileName="The document";
        
        // 1. Lookup a factory for the W3C XML Schema language
        System.setProperty("javax.xml.validation.SchemaFactory:"+XMLConstants.RELAXNG_NS_URI,
    "com.thaiopensource.relaxng.jaxp.CompactSyntaxSchemaFactory");

        SchemaFactory factory =
            SchemaFactory.newInstance(XMLConstants.RELAXNG_NS_URI);


        // 2. Compile the schema.
        // Here the schema is loaded from a java.io.File, but you could use
        // a java.net.URL or a javax.xml.transform.Source instead.
        File schemaLocation = new File("/usr/web/tei_all.rnc");
        Schema schema = factory.newSchema(schemaLocation);

        // 3. Get a validator from the schema.
        Validator validator = schema.newValidator();

        // 4. Parse the document you want to check.
        Source source = new StreamSource(new StringReader(text));

        // 5. Check the document
        try {
            validator.validate(source);
            return(fileName + " is valid.");
        }
        catch (SAXException ex) {
            return(fileName + " is not valid because "+ex.getMessage());
        }

    }

}
