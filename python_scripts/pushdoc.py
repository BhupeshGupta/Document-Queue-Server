import pymysql
import bottle
from bottle import post, run, request, get, static_file
import requests
import shutil
import uuid
import os
from lxml import etree
from io import StringIO, BytesIO
import datetime
import decimal
import json

config = {}
with open('config.json', 'r') as config_file:
    config = json.loads(config_file.read())

class AlfrescoRestApi(object):
    def __init__(self, user, password, url):
        self.user = user
        self.password = password
        self.url = url
        self.ticket = None

    def login(self):
        req = requests.get('{}/alfresco/service/api/login?u={}&pw={}'.format(
            self.url, self.user, self.password
        ))

        # TODO Check error code and raise exceptions
        print req.status_code
        xmldoc = etree.XML(req.content)
        if xmldoc.tag == 'ticket':
            self.ticket = xmldoc.text

        if not self.ticket:
            raise Exception('Unable to login')

    def upload(self, file_path, file_name, alfersco_properties):
        req = requests.post(
            '{}/alfresco/service/api/upload'.format(self.url),
            params={'alf_ticket': self.ticket},
            files=[
                ('filedata', (file_name, open(file_path, 'rb')))
            ],
            data=alfersco_properties
        )

        # TODO Check status code
        print req.status_code

        req = req.json()
        print req

        return req

    def update_properties(self, data, node_ref):
        url = '{}/alfresco/service/api/metadata/node/{}'.format(
            self.url,
            '/'.join(AlfrescoRestApi.parse_node_ref(node_ref))
        )

        req = requests.post(
            url,
            params={'alf_ticket': self.ticket},
            json=data
        )

        # TODO Check status code
        print req.status_code
        return req.json()

    def get_public_link(self, node_ref):
        public_file_url = "{}/share/proxy/alfresco/api/node/{}/{}/{}/content/thumbnails/imgpreview"
        return public_file_url.format(self.url, *AlfrescoRestApi.parse_node_ref(node_ref))

    @staticmethod
    def parse_node_ref(node_ref):
        storage_type, _ = node_ref.split('://')open("path/to/config.yml")

alfresco = AlfrescoRestApi(config['ALFRESCO_DB_USER'], config['ALFRESCO_DB_PASS'], config['ALFRESCO_DB_HOST'])
alfresco.login()


def pushdoc(doctype, docname, link):
    erpconnection = pymysql.connect(
        host=config['ERP_DB_HOST'],
        port=config['ERP_DB_PORT'],
        user=config['ERP_DB_USER'],
        password=config['ERP_DB_PASS'],
        db=config['ERP_DB_NAME']
    )

    doctype = {
        'Consignment Note': 'Sales Invoice'
    }.get(doctype, 'Indent Invoice')

    try:

        with erpconnection.cursor() as cursor:
            # Create a new record
            sql = """
            select *
            from `tabIndent Invoice`
            where (
                transportation_invoice = "{docname}"
                or transportation_invoice like "{docname}-%"
            )
            and docstatus = 1
            """.format(docname=docname, doctype=doctype)

            cursor.execute(sql)
            results = cursor.fetchall()
            columns = [x[0] for x in cursor.description]
            results = [{columns[index]: value for index, value in enumerate(result)} for result in results]
            for result in results:
                update = {}
                for key, value in result.iteritems():
                    if isinstance(value, datetime.date):
                        update[key] = value.strftime("%Y-%m-%d")
                    if isinstance(value, decimal.Decimal):
                        update[key] = str(value)
                    if isinstance(value, datetime.timedelta):
                        update[key] = ''
                result.update(update)

            result = results[0]

            file_path = '/tmp/{}'.format(uuid.uuid4())
            with open(file_path, 'wb') as handle:
                response = requests.get(link, stream=True)

                for block in response.iter_content(1024):
                    handle.write(block)

            upload = alfresco.upload(
                file_path,
                '{}_{}.jpg'.format(docname, doctype),
                {
                    'contenttype': 'BG:Indent_Invoice',
                    'siteid': 'receivings',
                    'containerid': 'documentLibrary'
                }
            )

            update_properties = alfresco.update_properties({
                "properties": {
                    'BG:{}'.format(key): value for key, value in result.iteritems() if value
                    }
                },
                upload['nodeRef']
            )

            cursor.execute('BEGIN;')

            sql = """
            update
            `tabIndent Invoice`
            set receiving_file = "{file_public_url}"
            where name= "{name}"
            """.format(file_public_url=alfresco.get_public_link(upload['nodeRef']), name=result['name'])

            print sql
            cursor.execute(sql)

        erpconnection.commit()

    except:
        with erpconnection.cursor() as cursor:
            cursor.execute('ROLLBACK;')

    finally:
        erpconnection.close()


@get('/push')
def push_doc():
    pushdoc(request.query.doctype, request.query.docname, request.query.link)


if __name__ == "__main__":
    run(host="0.0.0.0", port=9005)
