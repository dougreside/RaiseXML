package xmlEditor;


/**
 *
 * Class to validate xml documents against the tei-all schema, based on the IBM article found here:
 * http://www.ibm.com/developerworks/xml/library/x-javaxmlvalidapi.html
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
        
        // 1. Lookup a factory for the RNG schema
        System.setProperty("javax.xml.validation.SchemaFactory:"+XMLConstants.RELAXNG_NS_URI,"com.thaiopensource.relaxng.jaxp.CompactSyntaxSchemaFactory");
        SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.RELAXNG_NS_URI);
        File schemaLocation = new File("/usr/web/tei_all.rnc"); //use a schema stored on the server, could easily use a remote one but tei-all is ~275k
        Schema schema = factory.newSchema(schemaLocation);
        Validator validator = schema.newValidator();
        Source source = new StreamSource(new StringReader(text));
        try {
            validator.validate(source);
            return(fileName + " is valid.");
        }
        catch (SAXException ex) {
            return(fileName + " is not valid because "+ex.getMessage());
        }

    }

}
