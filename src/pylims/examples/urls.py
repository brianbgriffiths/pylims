from django.contrib import admin
from django.urls import path, re_path
from django.shortcuts import render
from django.http import HttpResponse, HttpRequest
from scripts import directory, triggerpipeline, ctools_user, cviewer, projects, triggertert, gettert
from django.template.defaulttags import register
from django.conf.urls import include
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
# from explorer import explorerapp
from explorer import explorerapp


import json, os, sys
sys.path.insert(0, 'C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\')

def userAuth(request):
    user={'userid':0}
    if request.session.get('userid'):
        user={'userid':request.session.get('userid'), 'username':request.session.get('username'), 'slackid':request.session.get('slackid'), 'initials':request.session.get('initials')}
    return(user)

def homePageView(request):
    context={}
    context['user']=userAuth(request)
    if not context['user']['userid']==0:
        return render(request, 'index-user.html', context)
    else:
        return render(request, 'index-guest.html', context)
        
def pipelinedev(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    context['projects']=json.dumps(projects.getProjects())
    return render(request, 'pipeline-dev.html', context)

def pipeline_merge(request):
    from scripts import pipeline_ea
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    samples=request.POST['samples']
    tile=request.POST['tile']
    project=request.POST['project']
    newsample=request.POST['newsample']
    context['status']=pipeline_ea.merge(samples,tile,project,newsample)
    return HttpResponse(json.dumps(context))
    
def pipeline_concat(request):
    from scripts import pipeline_ea
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    samples=request.POST['samples']
    newsample=request.POST['newsample']
    project=request.POST['project']
    clonesample=request.POST['clonesample']
    context['status']=pipeline_ea.concat(samples,newsample,project,clonesample)
    return HttpResponse(json.dumps(context))    

def pipeline_run_v1(request):
    from scripts import pipeline_ea
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    samples=request.POST['samples']
    samplesheet=request.POST['samplesheet']
    queue=request.POST['queue']
    context['status']=pipeline_ea.run_v1(samples,context['user']['initials'],samplesheet,queue)
    return HttpResponse(json.dumps(context))

def createproject(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    newname=request.POST['newname']
    context['project']=projects.create(newname,context['user']['username'])
    return HttpResponse(json.dumps(context))

def project_newsample(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    project=request.POST['project']
    context['sample']=projects.newsample(project,context['user']['username'])
    return HttpResponse(json.dumps(context))

def project_getsamples(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    project=request.POST['project']
    context['samples']=projects.getsamples(project)
    return HttpResponse(json.dumps(context))

def project_mergesamples(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    project=request.POST['project']
    sampleid=request.POST['sampleid']
    samplename=request.POST['samplename']
    illumina1=request.POST['illumina1']
    illumina2=request.POST['illumina2']
    merge1=request.POST['merge1']
    merge2=request.POST['merge2']
    context['samples']=projects.mergeSamples(illumina1,merge1,illumina2,merge2,project,sampleid,samplename,context['user']['username'])
    return HttpResponse(json.dumps(context))

def project_editsample(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    project=request.POST['project']
    sampleid=request.POST['sampleid']
    name=request.POST['name']
    tile=request.POST['tile']
    beads=request.POST['beads']
    species=request.POST['species']
    context['sample']=projects.editSample(project,sampleid,name,tile,beads,species,context['user']['username'])
    return HttpResponse(json.dumps(context))
    
def pipeline(request):
    context={}
    context['user']=userAuth(request)
    context['projects']=json.dumps(projects.getProjects())
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    return render(request, 'pipeline.html', context)

def pipeline_ea(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    return render(request, 'pipeline_ea.html', context)

def pipeline2(request,project):
    context={}
    context['user']=userAuth(request)
    context['project']=project
    context['projects']=json.dumps(projects.getProjects())
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    return render(request, 'pipeline.html', context)

def loadpipeline(request,rebuild=False):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    
    #check for last modified files
    lastsample_read = str(os.path.getmtime("C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\slink\\Caspio\\Sample Log.xlsx"))
    lastreque_read = 0
    files = []
    subdirs = []
    path = "C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\slink\\R&D\\Pipeline_Reruns"
    for root, dirs, filenames in os.walk(path):
        for subdir in dirs:
            subdirs.append(os.path.relpath(os.path.join(root, subdir), path))

        for f in filenames:
            if not f=='.DS_Store':
                fmtime = os.path.getmtime(os.path.join(root, f))
                if fmtime > lastreque_read:
                    lastreque_read = fmtime    
    lastreque_read=str(lastreque_read)

    try:
        with open("C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\last_sample.txt", "r") as f:
            lastsample_write=f.read()
        with open("C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\last_reque.txt", "r") as f:
            lastreque_write=f.read()    
        if not lastsample_write==lastsample_read or not lastreque_write==lastreque_read or rebuild==True:
            import subprocess
            sysoutput = subprocess.run("C:\\Users\\bgrif\\AppData\\Local\\Programs\\Python\\Python310\\python.exe C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\buildjson_ea.py", capture_output=True, shell=True)
            context['status']='rebuilt json'
        else:
            context['status']='cached json'
    finally:
        with open("C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\last_sample.txt", 'w') as f:
            f.write(lastsample_read)
        with open("C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\last_reque.txt", 'w') as f:
            f.write(lastreque_read)    
        f2 = open("C:/Users/bgrif/Documents/Curio/ctools/scripts/seqruns_ea.json", "r")
        context['json']=f2.read()
        
    return HttpResponse(json.dumps(context))

def compare_ea(request):
    from scripts import pipeline_ea
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    samples=request.POST['samples']
    context['sample']=pipeline_ea.compare(samples)
    return HttpResponse(json.dumps(context))

def rebuild_ea(request):
    import subprocess
    
    context={}
    sysoutput = subprocess.run("C:\\Users\\bgrif\\AppData\\Local\\Programs\\Python\\Python310\\python.exe C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\refresh_library_log.py")
    sysoutput = subprocess.run("C:\\Users\\bgrif\\AppData\\Local\\Programs\\Python\\Python310\\python.exe C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\buildjson_ea.py", capture_output=True, shell=True)
    context['status']='rebuilt json'
    f2 = open("C:/Users/bgrif/Documents/Curio/ctools/scripts/seqruns_ea.json", "r")
    context['json']=f2.read()
    return HttpResponse(json.dumps(context))
def insert_into_caspio(request):
    import subprocess
    project=request.POST['project']
    sample=request.POST['sample']
    newsample=request.POST['newsample']
    desc=request.POST['desc']
    
    sysoutput = subprocess.run(f'C:\\Users\\bgrif\\AppData\\Local\\Programs\\Python\\Python310\\python.exe C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\clone_into_caspio.py {project} {sample} {newsample} "{desc}"')
    context={'status':'success'}
    return HttpResponse(json.dumps(context))
def triggerPipeline(request):
    user=userAuth(request)
    context = triggerpipeline.trigger({'username':user['username']},request);
    return HttpResponse(json.dumps(context))
    
def triggerTert(request):
    user=userAuth(request)
    context = triggertert.trigger({'username':user['username']},request);
    return HttpResponse(json.dumps(context))
    
def triggerTert_ea(request):
    user=userAuth(request)
    context = triggertert.trigger_ea({'username':user['username']},request);
    return HttpResponse(json.dumps(context))
    
def getTert(request):
    user=userAuth(request)
    context = gettert.gettert({'username':user['username']},request);
    return HttpResponse(json.dumps(context))
    
def getTert_ea(request):
    user=userAuth(request)
    context = gettert.gettert_ea({'username':user['username']},request);
    return HttpResponse(json.dumps(context))    
    
def login(request):
    print('logging in')
    context = ctools_user.login({},request);
    print('gathered login info')
    return HttpResponse(json.dumps(context))
    
def logout(request):
    context = {}
    context['status']=ctools_user.unloadSession(request);
    return HttpResponse(json.dumps(context))
    
def resetpassword(request):
    context = ctools_user.resetpassword({},request);
    return HttpResponse(json.dumps(context))    

def requestnewpassword(request):
    context = ctools_user.requestnewpassword({},request);
    return HttpResponse(json.dumps(context))


def loadScreen(request):
    import loadscreen
    context = loadscreen.loadscreen({},request);
    return HttpResponse(json.dumps(context))
    
def loadgenes(request):
    import loadgenes
    outputfolder=request.POST['outputfolder']
    
    context = loadgenes.loadGenes({'outputfolder':outputfolder},request);
    return HttpResponse(json.dumps(context))
    
def loadgenes(request):
    import loadgenes
    outputfolder=request.POST['outputfolder']
    
    context = loadgenes.loadGenes({'outputfolder':outputfolder},request);
    return HttpResponse(json.dumps(context))    
    
def killScreen(request):
    import killscreen
    user=userAuth(request)
    context = killscreen.killscreen({'username':user['username']},request);
    return HttpResponse(json.dumps(context))

def genelookup(request):
    import genelookup
    context = genelookup.find({},request);
    return HttpResponse(json.dumps(context))        
    
def loadanalysis(request):
    import loadanalysis
    context = loadanalysis.loadanalysis({},request);
    return HttpResponse(json.dumps(context))
    
def loadanalysis_ea(request):
    import loadanalysis
    context = loadanalysis.loadanalysis_ea({},request);
    return HttpResponse(json.dumps(context))    
    
def analysis(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
        
    # import subprocess
    # subprocess.run("C:\\Users\\bgrif\\AppData\\Local\\Programs\\Python\\Python310\\python.exe C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\buildjson.py", capture_output=True, shell=True)
    f = open("C:\\wamp64\\bin\\apache\\apache2.4.51\\json\\seqruns.json", "r")
    context['seq']=f.read()
    
    import viewerSamples
    context['viewer']=viewerSamples.loadedSamples({},request)
    
    return render(request, 'analysis.html', context)
    
def analysis_ea(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
        
    # import subprocess
    # subprocess.run("C:\\Users\\bgrif\\AppData\\Local\\Programs\\Python\\Python310\\python.exe C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\buildjson.py", capture_output=True, shell=True)
    f = open("C:\\wamp64\\bin\\apache\\apache2.4.51\\json\\seqruns.json", "r")
    context['seq']=f.read()
    
    import viewerSamples
    context['viewer']=viewerSamples.loadedSamples({},request)
    
    return render(request, 'analysis_ea.html', context)    

def screens(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
        
    return render(request, 'screens.html', context)

def fun(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
        
    return render(request, 'fun.html', context)
    
    
def test(request):
    context={}
    context['session']=request.session.get('test', False)
    return render(request, 'test.html', context)

def tilepositions(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    return render(request, 'tilepositions.html', context)


def viewer(request,sample):
    context={}
    context['user']=userAuth(request)
    context['outputfolder']=sample
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
        
    context['session']=request.session.get('test', False)
    return render(request, 'viewer.html', context)
    
def recolor(request,path,sample):
    context={}
    context['user']=userAuth(request)
    context['path']=path
    context['sample']=sample
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
        
    context['session']=request.session.get('test', False)
    return render(request, 'recolor.html', context)

def aligned(request,path,sample):
    context={}
    context['user']=userAuth(request)
    context['path']=path
    context['sample']=sample
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
        
    context['session']=request.session.get('test', False)
    return render(request, 'aligned.html', context)        
    
def loadbeads(request):
    context={}
    outputfolder=request.POST['outputfolder']
    context['beadxy']=cviewer.bead_xy(outputfolder);
    return HttpResponse(json.dumps(context))

def recolor_loadbeads(request):
    context={}
    path=request.POST['path']
    sample=request.POST['sample']
    context['beadxy']=cviewer.ea_bead_xy(path,sample);
    return HttpResponse(json.dumps(context))
    
def changelog(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
        
    return render(request, 'changelog.html', context)
def extensions(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
        
    return render(request, 'extensions.html', context)
def explorer(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    return render(request, 'explorer.html', context)

def switchboard(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    
    import switchboard
    context['sb']=switchboard.getSwitchboards()
    print(context)
    return render(request, 'switchboard.html', context)

def switchboard_message_update(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    import switchboard    
    sb_board=request.POST['switchboard']
    sb_button=request.POST['button']
    sb_user=request.POST['user']
    sb_msg=request.POST['msg']
    context['sb']=switchboard.sbmsgUpdate(sb_board,sb_button,sb_user,sb_msg)
    return HttpResponse(json.dumps(context))

@csrf_exempt
@api_view(['POST'])    
def mailbot(request):
    from scripts import mailbot
    context={}
    sentdata=json.dumps(request.data)
    context['status']=mailbot.sendMsg(sentdata)
    context['response']='worked'
    return HttpResponse(json.dumps(context))
    
@csrf_exempt
@api_view(['POST'])    
def basespace(request):
    import subprocess
    print('post',request.body)
    post=json.loads(request.body)
    sheetid=post['sheetid']
    context={}
    sysoutput = subprocess.run(f"C:\\Users\\bgrif\\AppData\\Local\\Programs\\Python\\Python310\\python.exe C:\\Users\\bgrif\\Documents\\Curio\\ctools\\scripts\\basespace.py {sheetid}")
    context['status']='connected'
    return HttpResponse(json.dumps(context))

def jupyter(request):
    context={}
    context['user']=userAuth(request)
    if context['user']['userid']==0:
        return render(request, 'index-guest.html', context)
    return render(request, 'jupyter.html', context)

    
urlpatterns = [
    
    
    
    path('admin/', admin.site.urls),
    path('aligned/<str:path>/<str:sample>', aligned, name = 'aligned'),
    path('createproject/', createproject, name='createproject'), 
    path('explorer/', include('django_plotly_dash.urls')),
    path('explorer',explorer,name='explorer'),
    
    path('jupyter/',jupyter,name='jupyter'),
    
    path("", homePageView, name="home"),
    path("/", homePageView, name="home2"),
    path('pipeline/', pipeline, name = 'pipeline'),
    path('pipeline_ea/', pipeline_ea, name = 'pipeline_ea'),
    path('pipeline/<str:project>', pipeline2, name = 'pipeline2'),
    path('pipeline-dev/', pipelinedev, name = 'pipelinedev'),
    path('pipeline_merge/', pipeline_merge, name = 'pipeline_merge'),
    path('pipeline_concat/', pipeline_concat, name = 'pipeline_concat'),
    path('pipeline_run_v1/', pipeline_run_v1, name = 'pipeline_run_v1'),
    path('compare_ea/', compare_ea, name = 'compare_ea'),
    path('loadpipeline/', loadpipeline, name = 'loadpipeline'),
    path('test/', test, name = 'test'),
    path('insert_into_caspio/', insert_into_caspio, name = 'insert_into_caspio'),
    path('viewer/<str:sample>', viewer, name = 'viewer'),
    path('recolor/<str:path>/<str:sample>', recolor, name = 'recolor'),
    
    path('rebuild_ea/', rebuild_ea, name = 'rebuild_ea'),
    path('screens/', screens, name = 'screens'),
    path('changelog/', changelog, name = 'changelog'),
    path('analysis/', analysis, name = 'analysis'),
    path('analysis_ea/', analysis_ea, name = 'analysis_ea'),
    path('loadanalysis/', loadanalysis, name='loadanalysis'),
    path('loadanalysis_ea/', loadanalysis_ea, name='loadanalysis_ea'),
    path('trigger/', triggerPipeline, name='trigger'),
    path('triggertert/', triggerTert, name='triggertert'),
    path('triggertert_ea/', triggerTert_ea, name='triggertert_ea'),
    path('screen/', loadScreen, name='screen'),
    path('extensions/', extensions, name='extensions'),
    path('killscreen/', killScreen, name='killscreen'),
    path('genelookup/', genelookup, name='genelookup'),
    path('loadbeads/', loadbeads, name='loadbeads'),
    path('loadgenes/', loadgenes, name='loadgenes'),
    path('recolor_loadbeads/', recolor_loadbeads, name='recolor_loadbeads'),
    path('getTert/', getTert, name='getTert'),
    path('getTert_ea/', getTert_ea, name='getTert_ea'),
    path('login/', login, name='login'), 
    path('fun/', fun, name='fun'),
    path('tilepositions/', tilepositions, name='tilepositions'),     
    path('logout/', logout, name='logout'), 
    path('resetpassword/', resetpassword, name='resetpassword'), 
    path('requestnewpassword/', requestnewpassword, name='requestnewpassword'), 
    
    
    path('project_newsample/', project_newsample, name='project_newsample'),
    path('project_editsample/', project_editsample, name='project_editsample'),
    path('project_getsamples/', project_getsamples, name='project_getsamples'), 
    path('project_mergesamples/', project_mergesamples, name='project_mergesamples'), 
    path('mailbot/', mailbot, name='mailbot'), 
    path('switchboard/', switchboard, name='switchboard'), 
    path('switchboard_message_update/', switchboard_message_update, name='switchboard_message_update'),
    path('basespace/', basespace, name='basespace'),    
    
]
