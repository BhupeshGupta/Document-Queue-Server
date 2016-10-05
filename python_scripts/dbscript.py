import pymysql
import pandas as pd
import time
from time import gmtime, strftime
import json
from datetime import date, timedelta as td
import datetime

config = {}
with open('config.json', 'r') as config_file:
    config = json.loads(config_file.read())

def get_csv(start_date,end_date):

    erpconnection = pymysql.connect(host=config['ERP_DB_HOST'],
                                    port=config['ERP_DB_PORT'],
                                    user=config['ERP_DB_USER'],
                                    password=config['ERP_DB_PASS'],
                                    db=config['ERP_DB_NAME']
                                    )

    try:
        with erpconnection.cursor() as cursor:
            # Create a new record

            sql = """
            SELECT inv.name AS bill_no,
                inv.customer,
                inv.transaction_date AS posting_date,
                inv.amended_from AS bill_amended_from,
                inv.transportation_invoice AS name,
                sinv.amended_From AS sales_amended_from,
                inv.supplier,
                omc.field_officer,
                doc.status,
                doc.doctype
            FROM documentqueue.currentstat doc
            RIGHT JOIN `tabSales Invoice` sinv ON doc.cno = sinv.name
            LEFT JOIN `tabIndent Invoice` inv ON inv.transportation_invoice = sinv.name
            LEFT JOIN `tabOMC Customer Registration` omc ON inv.omc_customer_registration = omc.name
            WHERE
                inv.docstatus = 1 and
                sinv.docstatus = 1 and
                omc.docstatus = 1;
            """.format(start_date, end_date)
            # TODO: Add date filter

            cursor.execute(sql)

            result = []
            for x in cursor.fetchall():
                x = [y for y in x]
                if x[3]:
                    x[0] = '-'.join(x[0].split('-')[:-1])
                if x[5]:
                    x[4] = '-'.join(x[4].split('-')[:-1])
                result.append(x)



            df = pd.DataFrame(result)
            df.columns = [x[0] for x in cursor.description]
            indent_df = df
            indent_df.to_csv("/tmp/indent.csv", index = False)

        erpconnection.commit()

    finally:
        erpconnection.close()



def bar_graph(start_date, end_date):

    connection = pymysql.connect(
        host=config['SAILS_DB_HOST'],
        port=config['SAILS_DB_PORT'],
        user=config['SAILS_DB_USER'],
        password=config['SAILS_DB_PASS'],
        db=config['SAILS_DB_NAME']
    )

    rs = []

    start_date_object = datetime.datetime.strptime(start_date, "%Y-%m-%d")
    end_date_object = datetime.datetime.strptime(end_date, "%Y-%m-%d")

    delta = end_date_object - start_date_object
    try:
        with connection.cursor() as cursor:
            # Create a new record

            for status in [0, 1]:
                sql = """
                select date, count(id)
                from currentstat
                where status = "{}"
                and date between "{}" and "{}"
                group by date
                order by date
                """.format(status, start_date, end_date)

                cursor.execute(sql)
                result = cursor.fetchall()

                row = {
                    "key": "Pending" if status == 0 else "recieved",
                    "values": {
                        x[0].strftime('%Y-%m-%d'): x[1] for x in result
                    }
                }

                row['max'] = max(row['values'].values() or [0])

                for i in range(delta.days + 1):
                    row['values'].setdefault((start_date_object + td(days=i)).strftime('%Y-%m-%d'), 0)

                row['values'] = [{'x': x, 'y': y} for x, y in row['values'].iteritems()]

                row['values'] = sorted(row['values'], key=lambda obj: obj['x'])

                rs.append(row)

        rs = {'max': max([x['max'] for x in rs]), 'data': rs}

        connection.commit()
        print rs


    finally:
        connection.close()

    print json.dumps(rs)
    return json.dumps(rs)
