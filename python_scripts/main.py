from dbscript import get_csv, bar_graph
from pushdoc import pushdoc

import bottle
from bottle import post, run, request, get, static_file

@get('/excel')
def get_c():
    get_csv(request.query.from_date,request.query.to_date)
    return static_file('pandas.csv', root='/tmp')

@get('/bar')
def bargraph():
    print 'hello'
    return bar_graph(request.query.from_date,request.query.to_date)


@get('/push')
def push_doc():    
    pushdoc(request.query.doctype, request.query.docname, request.query.link)
    return

if __name__ == "__main__":
    run(host="0.0.0.0", port=9005)
app = bottle.default_app()
