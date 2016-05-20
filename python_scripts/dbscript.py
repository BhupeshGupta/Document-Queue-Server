import pymysql
import pandas as pd
import time
import bottle
from bottle import post, run, request, get, static_file
from time import gmtime, strftime
import json
from datetime import date, timedelta as td
import datetime

config = {}
with open('config.json', 'r') as config_file:
    config = json.loads(config_file.read())

def get_csv(start_date,end_date):
    connection = pymysql.connect(host=config['SAILS_DB_HOST'],
                                port=config['SAILS_DB_PORT'],
                                user=config['SAILS_DB_USER'],
                                password=config['SAILS_DB_PASS'],
                                db=config['SAILS_DB_NAME']
                                )

    erpconnection = pymysql.connect(host=config['ERP_DB_HOST'],
                                    port=config['ERP_DB_PORT'],
                                    user=config['ERP_DB_USER'],
                                    password=config['ERP_DB_PASS'],
                                    db=config['ERP_DB_NAME']
                                    )

    try:
        sails_df = ''
        erp_df = ''
        con=[]
        others=[]
        indent_df = ''
        with connection.cursor() as cursor:
            # Create a new record
            sql = """
            select cno as name, doctype, status, account
            from currentstat
            where date between "{start_date}" and "{end_date}"
            """.format(start_date=start_date, end_date=end_date)

            cursor.execute(sql)
            result = cursor.fetchall()
            data = list(result)

            for x in result:
                if x[1] == "Consignment Note":
                    con.append(x[0])
                else:
                    others.append(x[0])
            df = pd.DataFrame(data)

            if not result:
                df.to_csv("/tmp/pandas.csv", index = False)
                return

            df.columns = [x[0] for x in cursor.description]
            sails_df = df

        # connection is not autocommit by default. So you must commit to save
        # your changes.
        connection.commit()

        with erpconnection.cursor() as cursor:
            # Create a new record
            cond = ' or '.join( ['name = "{0}" or name like "{0}-%"'.format(x) for x in con] )

            sql = """
            select name, customer, posting_date, amended_from, company as supplier
            from `tabSales Invoice`
            where  ({cond})
            and docstatus = 1
            """.format(cond=cond)


            cursor.execute(sql)
            result = []
            for x in cursor.fetchall():
                x = [y for y in x]
                if x[3]:
                    x[0] = '-'.join(x[0].split('-')[:-1])
                result.append(x)

            df = pd.DataFrame(result)
            df.columns = [x[0] for x in cursor.description]
            df['doctype'] = "Consignment Note"
            erp_df = df
            erp_df.to_csv("/tmp/erp.csv", index = False)


        with erpconnection.cursor() as cursor:
            # Create a new record
            cond = ' or '.join( ['inv.transportation_invoice = "{0}" or inv.transportation_invoice like "{0}-%"'.format(x) for x in con] )

            sql = """
            select inv.name as bill_no,
            inv.customer,
            inv.transaction_date as posting_date,
            inv.amended_from as bill_amended_from,
            inv.transportation_invoice as name,
            sinv.amended_From as sales_amended_from,
		    inv.supplier,
            omc.field_officer
            from `tabIndent Invoice` inv join `tabSales Invoice` sinv
            on inv.transportation_invoice = sinv.name
    		join `tabOMC Customer Registration` omc on
    		inv.omc_customer_registration = omc.name
            where  ({cond})
            and inv.docstatus = 1
            """.format(cond=cond)

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
            df['doctype'] = "Indent Invoice"
            indent_df = df
            indent_df.to_csv("/tmp/indent.csv", index = False)


        fully_merged = pd.merge(sails_df, indent_df.append(erp_df), on=['name','doctype'])
        del fully_merged['bill_amended_from']
        del fully_merged['sales_amended_from']
        del fully_merged['amended_from']
        fully_merged = fully_merged[['posting_date', 'bill_no', 'customer', 'status', 'doctype', 'supplier', 'field_officer','account','name']]
        fully_merged = fully_merged.sort(['customer', 'posting_date'], ascending=[1, 1])
        fully_merged.to_csv("/tmp/pandas.csv", index = False)

        erpconnection.commit()

    finally:
        connection.close()
        erpconnection.close()



def bar_graph(start_date, end_date):
    connection = pymysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='root',
        db='demo'
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
        print rs;


    finally:
        connection.close()

    print json.dumps(rs)
    return json.dumps(rs)


@get('/excel')
def get_c():
    get_csv(request.query.from_date,request.query.to_date)
    return static_file('pandas.csv', root='/tmp')

@get('/bar')
def bargraph():
    print 'hello'
    return bar_graph(request.query.from_date,request.query.to_date)

if __name__ == "__main__":
    run(host="0.0.0.0", port=9005)
