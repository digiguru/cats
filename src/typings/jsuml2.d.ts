
 
declare var UMLDependency:any;
declare var UMLClassDiagram:any;
declare var UMLPackage:any;
declare var UMLClass:any;
declare var UMLInterface:any;
declare var UMLInterfaceExtended;
declare var UMLGeneralization:any;

declare module JSUML2 {
    
    var UMLClass:any;
    
    
    class Node {
        setName(name:string):void;
        notifyChange():void;        
    }
    
    class Relation {
        
    }
    
    class Diagram {
        addElement(element:any):void;
        setName(name:string):void;
        _nodes:Node[];
        _relations:Relation[];
        
    }
    
    class UMLPackage extends Node {
        
    }
    
    class UMLClassDiagram extends Diagram {
        
    }
    
    class UMLDependency extends Relation {
        
    }
    
    
}