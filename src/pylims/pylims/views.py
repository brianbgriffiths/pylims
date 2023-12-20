from django.contrib import admin
from django.urls import path, re_path
from django.shortcuts import render
from django.http import HttpResponse, HttpRequest
from django.template.defaulttags import register
from django.conf.urls import include
from django.views.decorators.csrf import csrf_exempt
import json

def home(request):
    context={'status':True}
    return HttpResponse(json.dumps(context))