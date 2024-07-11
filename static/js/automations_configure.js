console.log('mod',mod,'options',options)
const main = document.getElementById('automations');
const edit_window = document.getElementById('edit_window');
const edit_docked = document.getElementById('edit_docked');
const edit_maximize = document.getElementById('edit_maximize');
const edit_windowed = document.getElementById('edit_windowed');
const edit_minimize = document.getElementById('edit_minimize');
const includes = document.getElementById('includes')
const new_step = document.getElementById('workflow');
const step_list = document.getElementById('step_list');
const new_workflow = document.getElementById('new_workflow');
const workflow_list = document.getElementById('workflow_list');
var editing_step = null;
var editing_workflow = null;
var steps={}
var workflows={}

const Workflow = class {
    constructor(options) {
        if (!options || !options['id']) {
            console.error('No Id')
            return false;
        }
        this.element = document.createElement('div')
        this.id = options.id;
		this.name = options.name;
        this.type = options.type;
        this.status = options.status;
        this.version = options.version;
		this.element.id = this.id
		this.element.classList.add('workflow_container');
		this.element.innerHTML = this.name;
        if (workflow_list) {
		    workflow_list.appendChild(this.element);
        }
        this.element.addEventListener('click', this.editWorkflow);
        this.inputs={}
        this.containers={};
        this.subtypes=document.createElement('div')
        this.subtypeInputs={}
        this.subtypeContaiers
        this.initOptions();
        this.element.addEventListener('click', (e)=> {editing_step=false; this.editWorkflow(); });
        this.steps=[]
        if (options.steps) {
            for (let step of options.steps) {
                console.log('options step',step)
                this.steps.push(step);
            }
        }
    }
    addStep(stepid) {
        console.log('adding step',stepid,'to workflow',this.id);
        this.steps.push(stepid);
        steps[stepid].addStepToWorkflow(this.id);
        this.redrawSteps();
        // const save_steps = JSON.stringify(this.steps);
        
        // ws.send(JSON.stringify({ 'message': {type: 'save_workflow', message: 'saving workflow steps', data:{id:this.id,key:'steps',value:save_steps,jsonstring:true} } }));
    }
    removeStep(pos) {
        this.steps.splice(pos, 1);
        const save_steps = JSON.stringify(this.steps);
        // ws.send(JSON.stringify({ 'message': {type: 'save_workflow', message: 'saving workflow steps', data:{id:this.id,key:'steps',value:save_steps,jsonstring:true} } }));
        this.redrawSteps();
    }
    redrawSteps() {
        console.log('redraw steps',this.steps)
        includes.innerHTML=null;
        for (let step of this.steps) {
            let sc = document.createElement('div')
            sc.classList.add('step_in_workflow');
            sc.innerHTML = steps[step].name;
            includes.appendChild(sc);
            sc.addEventListener('click',(e)=> {
                const steps = Array.from(document.getElementsByClassName('step_in_workflow'));
                const index = steps.indexOf(e.target);
                ws.send(JSON.stringify({ 'message': {type: 'remove_step_from_workflow', message: 'removing step from workflow', data:{wf:this.id, step:this.steps[index], pos:index} } }));
            })
        }
    }
    editWorkflow(event) {
		ws.send(JSON.stringify({ 'message': {type: 'edit_workflow', message: 'editing workflow', data:{id:this.id} } }));
	}
    addInput(input,container=null) {
        //console.log('add input',input)
        this.inputs[input.id]=input;
        this.containers[input.id]=container;
    }

    updateInput(id,value) {
        console.log('update input',id,value)
        this.inputs[id].updateValue(value)
        if (id=='edit_workflow_name') {
            this.element.innerHTML=value;
        } 
    }
    initOptions() {
        // options all workflows get
        let workflow_name = new textbox({id:'edit_workflow_name'})
        workflow_name.element.value = this.name;
        workflow_name.element.parentid = this.id;
        workflow_name.element.addEventListener('input',function(event) {
            console.log(event)
            ws.send(JSON.stringify({ 'message': {type: 'save_workflow', message: 'saving workflow name', data:{id:event.target.parentid,key:'name',value:event.target.value} } }));
        });
        this.addInput(workflow_name, 'hidden')

        let type_container = document.createElement('div')
        // edit_content.appendChild(type_container)
        let type_label = document.createElement('span');
        type_label.innerHTML = 'Set Type: '
        type_container.appendChild(type_label)

            let type = new dropdown({id:'edit_type', default:'Choose', display:'inline-block',value:this.type});
            type.id='edit_workflow_type';
            type.parentid=this.id;
            let types = [{key:'Standard',value:'Standard'}]
            type.add_options({type:'dict',dict:types, keys:'key', values:'value'});
            type.element.addEventListener('dropdownchange', function(event) {
                console.log(event)
                ws.send(JSON.stringify({ 'message': {type: 'save_workflow_type', message: 'saving workflow type', data:{id:event.detail.id,key:'type',value:type.value} } }));
            });
            this.addInput(type, type_container)

        const status = new multitoggle({id:'edit_workflow_status',value:this.status,style:'flow'});
        status.parentid=this.id;
        status.setOptions([{text:"Design",value:"design"},{text:"Development",value:"dev"},{text:"Active",value:"active"},{text:"Deprecated",value:"deprecated"},{text:"Retired",value:"retired"}])
        status.element.style.setProperty('--multitoggle-border-color', 'var(--green-med)');
        this.addInput(status)
        
        status.element.addEventListener('multitogglechange', function(event) {
            console.log(event)
            ws.send(JSON.stringify({ 'message': {type: 'save_workflow', message: 'saving workflow type', data:{id:event.detail.id,key:'status',value:status.value} } }));
        });

    }
    typeOptions() {
        this.subtypes.innerHTML=null;
        if (this.type=='Queue') {
            let limit_container = document.createElement('div')
            limit_container.innerHTML='limit'
            this.subtypes.appendChild(limit_container)
        }
        const edit_content = document.getElementById('edit_content');
        edit_content.appendChild(this.subtypes);
    }

    displayOptions() {
        const edit_content = document.getElementById('edit_content');
        const container = document.createElement('div')
        for (let input in this.inputs) {
            if (this.containers[input]) {
                if (this.containers[input]=='hidden') { continue }
                edit_content.appendChild(this.containers[input]);
                this.containers[input].appendChild(this.inputs[input].element);
                continue;
            }
            edit_content.appendChild(this.inputs[input].element);
        }
        this.typeOptions();


    }
}

const Step = class {
    constructor(options) {
        if (!options || !options['id']) {
            console.error('No Id')
            return false;
        }
        if (!options.status) {
            options.status='design';
        }
        this.element = document.createElement('div')
        this.id = options.id;
		this.name = options.name;
        this.type = options.type;
        this.status = options.status;
        this.version = options.version;
		this.element.id = this.id
		this.element.classList.add('step_container');
		this.element.innerHTML = this.name;
        if (step_list) {
		    step_list.appendChild(this.element);
        }
        this.editStep = this.editStep.bind(this);
        this.addStepToWorkflow = this.addStepToWorkflow.bind(this);
        this.element.addEventListener('click', (e)=> {
            if (!e.shiftKey) { 
                editing_workflow=false; 
                this.editStep(); 
            } else if (e.shiftKey && editing_workflow) { 
                console.log('Trigger: Add Step to Workflow'); 
                ws.send(JSON.stringify({ 'message': {type: 'add_step_to_workflow', message: 'Adding Step to Workflow', data:{wf:editing_workflow,step:this.id} } }));
            }
            });
        this.inputs={}
        this.containers={};
        this.subtypes=document.createElement('div')
        this.subtypeInputs={}
        this.subtypeContaiers;
        this.workflows=[];
        if (options.workflows) {
            setTimeout( ()=> {
                for (let wf of options.workflows) {
                    this.workflows.push(wf)
                }
            },100)
        }
        this.initOptions();
    }

    redrawWorkflows() {
        includes.innerHTML=null;
        var already_drawn={}
        console.log(this.workflows)
        for (let workflow of this.workflows) {
            if (!already_drawn[workflow]) {
                let sc = document.createElement('div')
                sc.classList.add('workflows_with_step');
                
                const count = this.workflows.filter(wf => wf === workflow).length;
                sc.innerHTML = `${workflows[workflow].name} (${count})`;
                sc.dataset.workflow=workflow;
                includes.appendChild(sc)
                already_drawn[workflow]=true;
            }
        }
    }

    addStepToWorkflow(wf) {
        this.workflows.push(wf);
    }

    editStep(event) {
		ws.send(JSON.stringify({ 'message': {type: 'edit_step', message: 'editing step', data:{id:this.id} } }));
	}

    addInput(input,container=null) {
        //console.log('add input',input)
        this.inputs[input.id]=input;
        this.containers[input.id]=container;
    }

    updateInput(id,value) {
        // console.log('update input',id,value)
        this.inputs[id].updateValue(value)
        if (id=='edit_element_name') {
            this.element.innerHTML=value;
        } 
    }
    initOptions() {
        // options all steps get
        let step_name = new textbox({id:'edit_element_name'})
        step_name.element.value = this.name;
        step_name.element.parentid = this.id;
        step_name.element.addEventListener('input',function(event) {
            console.log(event)
            ws.send(JSON.stringify({ 'message': {type: 'save_step', message: 'saving step name', data:{id:event.target.parentid,key:'name',value:event.target.value} } }));
        });
        this.addInput(step_name, 'hidden')

        let type_container = document.createElement('div')
        // edit_content.appendChild(type_container)
        let type_label = document.createElement('span');
        type_label.innerHTML = 'Set Type: '
        type_container.appendChild(type_label)

            let type = new dropdown({id:'edit_type', default:'Choose', display:'inline-block',value:this.type});
            type.id='edit_element_type';
            type.parentid=this.id;
            let types = [{key:'Queue',value:'Queue'},{key:'Placement',value:'Placement'},{key:'Script',value:'Run Script'},{key:'Function',value:'Run Function'},{key:'Records',value:'Records',value:'Finish'}]
            type.add_options({type:'dict',dict:types, keys:'key', values:'value'});
            type.element.addEventListener('dropdownchange', function(event) {
                console.log(event)
                ws.send(JSON.stringify({ 'message': {type: 'save_step_type', message: 'saving step type', data:{id:event.detail.id,key:'type',value:type.value} } }));
            });
            this.addInput(type, type_container)

        const status = new multitoggle({id:'edit_element_status',value:this.status,style:'flow'});
        status.parentid=this.id;
        status.setOptions([{text:"Design",value:"design"},{text:"Development",value:"dev"},{text:"Active",value:"active"},{text:"Deprecated",value:"deprecated"},{text:"Retired",value:"retired"}])
        status.element.style.setProperty('--multitoggle-border-color', 'var(--pink-med)');
        this.addInput(status)
        
        status.element.addEventListener('multitogglechange', function(event) {
            console.log(event)
            ws.send(JSON.stringify({ 'message': {type: 'save_step', message: 'saving step type', data:{id:event.detail.id,key:'status',value:status.value} } }));
        });

    }
    typeOptions() {
        this.subtypes.innerHTML=null;
        if (this.type=='Queue') {
            let limit_container = document.createElement('div')
            limit_container.innerHTML='limit'
            this.subtypes.appendChild(limit_container)
        }
        const edit_content = document.getElementById('edit_content');
        edit_content.appendChild(this.subtypes);
    }

    displayOptions() {
        const edit_content = document.getElementById('edit_content');
        const container = document.createElement('div')
        for (let input in this.inputs) {
            if (this.containers[input]) {
                if (this.containers[input]=='hidden') { continue }
                edit_content.appendChild(this.containers[input]);
                this.containers[input].appendChild(this.inputs[input].element);
                continue;
            }
            edit_content.appendChild(this.inputs[input].element);
        }
        this.typeOptions();


    }
}

const edit_content = document.getElementById('edit_content');
const edit_header = document.getElementById('edit_header');
const includes_header = document.getElementById('includes_header');
const title = document.getElementById('edit_header_title');


function edit_step(id) {
    editing_step = id;
    var newUrl = `https://local.pylims.com/modules/automations/configure`;
    if (editing_step && is_fullscreen_editor) {
        newUrl = `https://local.pylims.com/modules/automations/fullscreen_editor/?step=${editing_step}`; // Specify the new URL path
    } else if (editing_step) {
        newUrl = `https://local.pylims.com/modules/automations/configure/?step=${editing_step}`; // Specify the new URL path
    } 
    history.pushState(null, "", newUrl);

    
    edit_header.style.backgroundColor='var(--pink-med)';
    includes_header.style.backgroundColor='var(--pink-med)';
    includes_header.innerHTML='In Workflows:'
    title.innerHTML=null;
    edit_content.innerHTML=null;
    const save_icon = document.createElement('div');
    save_icon.id='save_icon'
    if (is_edit_window_minimized==true) {
        return false;
    }

    save_icon.innerHTML='<i class="fa-light fa-diamond"></i>';
    title.appendChild(save_icon);
    title.appendChild(steps[id].inputs['edit_element_name'].element)

    steps[id].inputs['edit_element_status'].element.style.setProperty('--multitoggle-transition', 'none');
    steps[id].displayOptions()
    steps[id].inputs['edit_element_status'].updateValue(steps[id].status)
    setTimeout(function() { 
        steps[id].inputs['edit_element_status'].element.style.setProperty('--multitoggle-transition', 'width .5s, left .5s, opacity .5s');
    },10); // This is to turn the smooth transitions back on after the element has loaded
    steps[id].redrawWorkflows()
}

function edit_workflow(id) {
    editing_workflow = id;
    var newUrl = `https://local.pylims.com/modules/automations/configure`;
    if (editing_step && is_fullscreen_editor) {
        newUrl = `https://local.pylims.com/modules/automations/fullscreen_editor/?workflow=${editing_workflow}`; // Specify the new URL path
    } else if (editing_step) {
        newUrl = `https://local.pylims.com/modules/automations/configure/?workflow=${editing_workflow}`; // Specify the new URL path
    } 
    history.pushState(null, "", newUrl);

    edit_header.style.backgroundColor='var(--green-med)';
    includes_header.style.backgroundColor='var(--green-med)';
    includes_header.innerHTML = `${workflows[id].name} Steps`;
    title.innerHTML=null;
    edit_content.innerHTML=null;
    const save_icon = document.createElement('div');
    save_icon.id='save_icon'
    if (is_edit_window_minimized==true) {
        return false;
    }

    save_icon.innerHTML='<i class="fa-light fa-gear"></i>';
    title.appendChild(save_icon);
    title.appendChild(workflows[id].inputs['edit_workflow_name'].element)

    workflows[id].inputs['edit_workflow_status'].element.style.setProperty('--multitoggle-transition', 'none');
    workflows[id].displayOptions()
    workflows[id].inputs['edit_workflow_status'].updateValue(workflows[id].status)
    setTimeout(function() { 
        workflows[id].inputs['edit_workflow_status'].element.style.setProperty('--multitoggle-transition', 'width .5s, left .5s, opacity .5s');
    },10); // This is to turn the smooth transitions back on after the element has loaded
    workflows[id].redrawSteps();
}

var opened_window = null;
function edit_window_open() {
	automation_container_maximize();
	edit_window_minimize();
    console.log('edit screen',editing_step,is_fullscreen_editor)
    if (editing_step) {
        opened_window = window.open(`https://local.pylims.com/modules/automations/fullscreen_editor/?edit=${editing_step}`, 'fullScreenEditor', 'width=800,height=600,scrollbars=yes,resizable=yes');
    } else {
        opened_window = window.open(`https://local.pylims.com/modules/automations/fullscreen_editor/`, 'fullScreenEditor', 'width=800,height=600,scrollbars=yes,resizable=yes');
    }
	
	window.addEventListener('message', function(event) {
		if (event.data === 'closeWindow') {
			console.log('closing external window');
			edit_window_dock();
			automation_container_dock();
		}
	});
}

function undock() {
	window.opener.postMessage('closeWindow', '*');
            // Close the new window
            window.close();
}

function automation_container_maximize() {
	main.classList.add('automations_maximized');
	// let acs = document.querySelectorAll('.automation_container')
	let autocon = document.getElementById('automation_container');
	autocon.classList.add('automation_container_maximized')
}

function automation_container_dock() {
	main.classList.remove('automations_maximized');
	// let acs = document.querySelectorAll('.automation_container')
	let autocon = document.getElementById('automation_container');
	autocon.classList.remove('automation_container_maximized');
}

function edit_window_maximize() {
	edit_docked.style.display='block';
	edit_maximize.style.display='none';
	edit_minimize.style.display='block';
	edit_window.classList.remove(...edit_window.classList);
	edit_window.classList.add('center-border','edit_window_maximized');
    const edit_content = document.getElementById('edit_content');
    edit_content.style.display = 'block';
}
function edit_window_dock() {
	edit_docked.style.display='none';
	edit_maximize.style.display='block';
	edit_minimize.style.display='block';
	edit_window.classList.remove(...edit_window.classList);
	edit_window.classList.add('center-border');
    const edit_content = document.getElementById('edit_content');
    edit_content.style.display = 'block';
    automation_container_dock();
}
function edit_window_minimize() {
	edit_docked.style.display='block';
	edit_maximize.style.display='block';
	edit_minimize.style.display='none';
	edit_window.classList.remove(...edit_window.classList);
	edit_window.classList.add('center-border','edit_window_minimized');
    is_edit_window_minimized=true;
    const edit_content = document.getElementById('edit_content');
    edit_content.style.display = 'none';
	automation_container_maximize();
}

function add_new_step() {
	const new_step_input = document.getElementById('new_step_input')

	console.log('setting',new_step)
	new_step.style.height='35px';
	setTimeout(function() {
		new_step_input.focus();
	},1000);
}

function create_new_step() {
	clear_msg_elements();
	const new_step_name = document.getElementById('new_step_input').value;
	if (!new_step_name || new_step_name.length<3) {
		pylims_request_error({error_id:'pylims_request_error',error:'New Step name must be longer than...that.'})
		return false;
	}
	data={new_step_name}
	const pyoptions={data,csrf,urlprefix,url:'create_new_step',submit_id:'create_new_step',submit_mode:'success'}
	pylims_post(pyoptions).then(result => {
		new_step.style.height='0px';
		console.log(result);
		sendMessage('create_step','New Step Created',{name:result['new_name'],id:result['new_id']});
	}).catch(error => {
		console.error(error);
	});
}

function add_new_workflow() {
	const new_workflow_input = document.getElementById('new_workflow_input')

	console.log('setting',new_workflow)
	new_workflow.style.height='35px';
	setTimeout(function() {
		new_workflow_input.focus();
	},1000);
}

function create_new_workflow() {
	clear_msg_elements();
	const new_workflow_name = document.getElementById('new_workflow_input').value;
	if (!new_workflow_name || new_workflow_name.length<3) {
		pylims_request_error({error_id:'pylims_request_error',error:'New workflow name must be longer than...that.'})
		return false;
	}
	data={new_workflow_name}
	const pyoptions={data,csrf,urlprefix,url:'create_new_workflow',submit_id:'create_new_workflow',submit_mode:'success'}
	pylims_post(pyoptions).then(result => {
		new_workflow.style.height='0px';
		console.log(result);
		sendMessage('create_workflow','New workflow Created',{name:result['new_name'],id:result['new_id']});
	}).catch(error => {
		console.error(error);
	});
}



function step_created(id,name) {
	console.log('adding step',id,name)
	steps[id] = new Step({id,name});
}

const ws = new WebSocket('wss://' + window.location.host + '/ws/automation/');

ws.onmessage = function(event) {
	const data = JSON.parse(event.data);
	const message = data.message;
	console.log('websocket message:',message)
	if (message.type=='create_step') {
		step_created(message.data.id,message.data.name)
	} else if (message.type=='edit_step' && message.data.op_id==user.userid) {
		edit_step(message.data.id)
	} else if (message.type=='save_step_type' && editing_step == message.data.id) {
        steps[message.data.id].updateInput('edit_element_'+message.data.key, message.data.value)
        steps[message.data.id].initOptions();
        steps[message.data.id].type = message.data.value;
        if (steps[message.data.id].type) {
            steps[message.data.id].typeOptions();
        }
    } else if (message.type=='save_step' && editing_step == message.data.id) {
        if (message.data.jsonstring) { message.data.value = JSON.parse(message.data.value); }
        steps[message.data.id][message.data.key]=message.data.value;
        if (steps[message.data.id].inputs['edit_element_'+message.data.key]) {
            steps[message.data.id].updateInput('edit_element_'+message.data.key, message.data.value)
        }
    } else if (message.type=='edit_workflow' && message.data.op_id==user.userid) {
        edit_workflow(message.data.id)
    } else if (message.type=='save_workflow_type' && editing_workflow == message.data.id) {
        workflows[message.data.id].updateInput('edit_workflow_'+message.data.key, message.data.value)
        workflows[message.data.id].initOptions();
        workflows[message.data.id].type = message.data.value;
        if (workflows[message.data.id].type) {
            workflows[message.data.id].typeOptions();
        }
    } else if (message.type=='save_workflow' && editing_workflow == message.data.id) {
        console.log('save workflow')
        if (message.data.jsonstring) { message.data.value = JSON.parse(message.data.value); }
        workflows[message.data.id][message.data.key]=message.data.value;
        if (workflows[message.data.id].inputs['edit_workflow_'+message.data.key]) {
            workflows[message.data.id].updateInput('edit_workflow_'+message.data.key, message.data.value);
        }
    } else if (message.type=='add_step_to_workflow' && editing_workflow == message.data.wf) {
        workflows[message.data.wf].addStep(message.data.step);
    } else if (message.type=='remove_step_from_workflow' && editing_workflow == message.data.wf) {
        workflows[message.data.wf].removeStep(message.data.pos);
    }
}
ws.onclose = function(event) {
    console.error("WebSocket is closed now.");
    const x = new popup({id:'ws_disconnect',title:'Connection Lost',unclosable:true});
    x.html_content('Your connection was interrupted. Reload the page to see current data.')
    x.show();
};

function sendMessage(type,msg,data) {
	ws.send(JSON.stringify({ 'message': {type: type, message: msg, data: data} }));
}

function populate_step_list(data) {
	for (let s of data) {
		steps[s.asid] = new Step({'id':s.asid, 'name':s.name, 'type':s.type, 'status':s.status, 'version':s.version, 'workflows':JSON.parse(s.workflows)})
	}
}
function populate_workflow_list(data) {
    console.log(data)
	for (let s of data) {
		workflows[s.wfid] = new Workflow({'id':s.wfid, 'name':s.name, 'type':s.type, 'status':s.status, 'version':s.version, 'steps':JSON.parse(s.steps)})
	}
}
document.addEventListener('keydown', function(event) {
    if (event.key === 'Shift' && editing_workflow) {
        let stepContainers = document.querySelectorAll('.step_container');
        for (let e of stepContainers) {
            e.classList.add('add_step_to_workflow');
        }
    } else if (event.key === 'Control' && editing_workflow) {
        let stepContainers = document.querySelectorAll('.step_in_workflow');
        for (let e of stepContainers) {
            e.classList.add('remove_step_from_workflow');
        }
    }
});

document.addEventListener('keyup', function(event) {
    if (event.key === 'Shift') {
        let stepContainers = document.querySelectorAll('.step_container');
        for (let e of stepContainers) {
            e.classList.remove('add_step_to_workflow');
        }
    } else if (event.key === 'Control') {
        let stepContainers = document.querySelectorAll('.step_in_workflow');
        for (let e of stepContainers) {
            e.classList.remove('remove_step_from_workflow');
        }
    }
});