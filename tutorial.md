# Useful functions



# Tutorial

Using the scripting system you can write and run javascript to work with your data. You can do things like:

* Clean up and transform data
* Load data from the web
* Create new views (graphs, maps etc)

## First example: Hello world

In this example we will not do anything with data at all, we will just show how to use the print function. Note that the print function is not part of javascript but is a convenience function provided for you (you will be introduced to further convenience functions below)

Create a new project and do not bother loading any data:

    print('hello world')

Hit the "Run the Code" button. You should see the words "hello world" printed in the grey output section to the RHS of the editor.

## Introducing the dataset

The data(set) associated to a project is available to you in the script editor in the `dataset` variable.

Create a project  ... (fork this existing one)

var dataset = getDataset();
saveDataset(dataset);


## Clean and graph data

print('Starting');
// async behaviour ...
var data = loadCSV('....');

// who has the highest bond yields in Europe?

// How has Greece been doing ...

plot(data, { x: ..., series: ... });


## Some concepts

Dataset = Records + Fields

Like a table but explicitly define the columns (known as Fields) and the rows in the table (Records).

Each record is just a hash:

    { 'fieldName': fieldValue, 'fieldName2': fieldValue2, ... }

Each Field is also a hash, that follows the JSON table schema. At a minimum all it must contains is:

    {
      # unique name of the field (normally just the column heading)
      'id': fieldName
    }

