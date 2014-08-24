/**
 * Base class for all the configuration dialogs forms in
 * CATS.
 */ 
class SearchDialog extends qx.ui.window.Window {

    private form = new qx.ui.form.Form();
    private rootDir:string;

    constructor() {
        super("Search");

        var layout = new qx.ui.layout.Canvas();
        this.setLayout(layout);
        this.createForm();
        this.setModal(true);
        this.addListener("resize", this.center);
        
    }
    
    search(rootDir) {
        this.rootDir = rootDir;    
        this.show();
    }
    
    private run(search:string, filePattern) {
        if (! filePattern) filePattern = "**/*";
         OS.File.find(filePattern,this.rootDir,  (err:Error,files:Array<string>) => {
            files.forEach((file) => {
                try {
                    var fullName = OS.File.join(this.rootDir, file);
                    var content = OS.File.readTextFile(fullName);
                    // console.log("Scanned " + fullName);
                } catch (err) {
                    console.error("Got error while handling file " + fullName);
                    console.error(err);
                }
            });
         });    
    }
    
    private addTextField(label:string, model:string) {
        var t = new qx.ui.form.TextField();
        t.setWidth(200);
        this.form.add(t, label, null, model); 
        return t;
    }
    
    createForm() {
        var s = this.addTextField("Search for", "search");
        s.setRequired(true);
        
        var p = this.addTextField("File Pattern", "glob");
        var searchButton = new qx.ui.form.Button("Search");
        var cancelButton = new qx.ui.form.Button("Cancel");
        this.form.addButton(searchButton);
        searchButton.addListener("execute", () => {
            if (this.form.validate()) {
                this.run(s.getValue(), p.getValue());
            };
        }, this);
        this.form.addButton(cancelButton);
        var renderer = new qx.ui.form.renderer.Single(this.form);
        this.add(renderer);
    }
    
}