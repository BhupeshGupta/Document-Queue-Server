import pymysql
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
            auth=(self.user, self.password),
            files=[
                ('filedata', (file_name, open(file_path, 'rb')))
            ],
            data=alfersco_properties
        )

        if req.status_code != 200:
            
            raise Exception('Alfresco upload returned {}'.format(req.status_code))

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
            auth=(self.user, self.password),
            json=data
        )
        if req.status_code != 200:
           
            raise Exception('Alfresco property update returned {}'.format(req.status_code))
        return req.json()

    def get_public_link(self, node_ref):
        public_file_url = "{}/share/proxy/alfresco/api/node/{}/{}/{}/content/thumbnails/imgpreview"
        return public_file_url.format(self.url, *AlfrescoRestApi.parse_node_ref(node_ref))

    @staticmethod
    def parse_node_ref(node_ref):
        storage_type, _ = node_ref.split('://')
        storage_id, file_id = _.split('/')
        return storage_type, storage_id, file_id

alfresco = AlfrescoRestApi(config['ALFRESCO_DB_USER'], config['ALFRESCO_DB_PASS'], config['ALFRESCO_DB_HOST'])
alfresco.login()


def pushdoc(doctype, docname, link):    
    print datetime.datetime.now().time()
    def map_erp_doctype(doctype):
        if doctype in ('Indent Invoice', 'Excise Invoice', 'VAT Form XII'):
            return 'Indent Invoice'
        if doctype == 'Consignment Note':
            return 'Sales Invoice'

    def get_conditions(erp_doctype, docname):
        cond = []
        if erp_doctype == 'Indent Invoice':
            cond.append('transportation_invoice = "{docname}"')
            cond.append('transportation_invoice like "{docname}-%"')
        if erp_doctype == 'Sales Invoice':
            cond.append('name = "{docname}"')
            cond.append('name like "{docname}-%"')
        return ' or '.join(cond).format(docname=docname, doctype=doctype)

    def map_alfresco(doctype):
        if doctype == 'Indent Invoice':
            return 'II', 'Indent'
        if doctype == 'Excise Invoice':
            return 'EI', 'Excise_Invoice'
        if doctype == 'Consignment Note':
            return 'SI', 'sales'
        if doctype == 'VAT Form XII':
            return 'VXII', 'Form_XII'

    def find_doc(doctype):
        return 'receiving_file' if doctype == 'Indent Invoice' or doctype == 'Consignment Note' else 'data_bank'

    def update_rec_file(doctype):
        if find_doc(doctype) == 'receiving_file':
            return alfresco.get_public_link(upload['nodeRef'])
        else:
            sql = """
            select data_bank
            from `tab{}` where ({})
            and docstatus = 1
            """.format(erp_doctype, get_conditions(erp_doctype, docname))
            cursor.execute(sql)
            results = cursor.fetchall()
            result = json.loads(results[0][0])
            result.setdefault('receivings', {})
            result['receivings'].update({doctype: alfresco.get_public_link(upload['nodeRef'])})
            return json.dumps(result)

    erpconnection = pymysql.connect(
        host=config['ERP_DB_HOST'],
        port=config['ERP_DB_PORT'],
        user=config['ERP_DB_USER'],
        password=config['ERP_DB_PASS'],
        db=config['ERP_DB_NAME']
    )

    try:
        with erpconnection.cursor() as cursor:
            erp_doctype = map_erp_doctype(doctype)
            sql = """
            select *
            from `tab{}`
            where ({})
            and docstatus = 1
            """.format(erp_doctype, get_conditions(erp_doctype, docname))

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

            if 'indent' in result:
                del result['indent']

            file_path = '/tmp/{}'.format(uuid.uuid4())
            with open(file_path, 'wb') as handle:
                response = requests.get(link, stream=True)

                for block in response.iter_content(1024):
                    handle.write(block)

            prefix, alfresco_model = map_alfresco(doctype)
	    print datetime.datetime.now().time()
            upload = alfresco.upload(
                file_path,
                '{}_{}.jpg'.format(docname, doctype),
                {
                    'contenttype': '{}:{}'.format(prefix, alfresco_model),
                    'siteid': config['ALFRESCO_SITEID'],
                    'containerid': config['ALFRESCO_CONTAINERID']
                }
            )
	    print datetime.datetime.now().time()
            update_properties = alfresco.update_properties({
                "properties": {
                    '{}:{}'.format(prefix, key): value for key, value in result.iteritems() if value
                    }
                },
                upload['nodeRef']

            )
	    print datetime.datetime.now().time()
            cursor.execute('BEGIN;')
            sql = """
            update
            `tab{}`
            set {} = '{}'
            where ({})
            and docstatus = 1
            """.format(
                map_erp_doctype(doctype),
                find_doc(doctype),
                update_rec_file(doctype),
                get_conditions(erp_doctype, docname)
            )

            cursor.execute(sql)

        erpconnection.commit()

    except Exception as e:
        print e
        with erpconnection.cursor() as cursor:
            cursor.execute('ROLLBACK;')
        raise
    finally:
        erpconnection.close()
	print datetime.datetime.now().time()
