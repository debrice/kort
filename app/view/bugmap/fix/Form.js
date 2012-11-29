Ext.define('Kort.view.bugmap.fix.Form', {
	extend: 'Ext.Container',
	alias: 'widget.fixform',
    requires: [
        'Ext.form.Panel',
        'Ext.Button',
        'Ext.field.Select',
        'Ext.field.Number',
        'Ext.field.Text',
        'Kort.view.bugmap.fix.type.Select'
    ],
    
	config: {
		layout: 'vbox',
        cls: 'fixform',
        scrollable: true,
        title: Ext.i18n.Bundle.message('fix.form.title'),
        fullscreen: true
	},
    
    initialize: function () {
        var fixContentComponent,
            fixFormPanel,
            fixField;
        
        this.callParent(arguments);
        
        fixContentComponent = {
            xtype: 'component',
            cls: 'fixContentComponent',
            record: this.getRecord(),
            tpl:    new Ext.Template(
                        '<div class="fix-content">',
                            '<div class="description">',
                                '<div class="image">',
                                    '<img class="bugtype-image" src="./resources/images/marker_icons/{type}.png" />',
                                '</div>',
                                '<div class="content">',
                                    '<p>{description}</p>',
                                '</div>',
                            '</div>',
                        '</div>'
                    )
        };
        
        fixField = this.createFixField(this.getRecord());
        
        fixFormPanel = {
            xtype: 'formpanel',
            cls: 'fixFormPanel',
            scrollable: false,
            flex: 1,
            items: [
                fixField,
                {
                    xtype: 'button',
                    cls: 'fixSubmitButton',
                    ui: 'confirm',
                    id: 'fixFormSubmitButton',
                    text: Ext.i18n.Bundle.message('fix.form.button.submit')
                }
            ]
        };
        
        this.add([fixContentComponent, fixFormPanel]);
    },
    
    createFixField: function(bug) {
        var fixField,
            fieldConfig = {
                name: 'fixfield',
                cls: 'fixfield'
            };
        
        if(bug.get('view_type') === 'select') {
            fieldConfig = Ext.merge(fieldConfig, {
                type: bug.get('type')
            });
            
            fixField = Ext.create('Kort.view.bugmap.fix.type.Select', fieldConfig);
        } else if(bug.get('view_type') === 'number') {
            fixField = Ext.create('Ext.field.Number', fieldConfig);
        } else {
            fixField = Ext.create('Ext.field.Text', fieldConfig);
        }
        
        // TODO i18n bundle doens't work for placeholders
        fixField.setPlaceHolder(this.getRecord().get('answer_placeholder'));
        
        return fixField;
    }
});
