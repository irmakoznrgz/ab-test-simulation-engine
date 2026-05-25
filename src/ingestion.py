from config.database import execute_query

def insert_user_action(user_id, group_name, converted, purchase_amount):
    query = """
        INSERT INTO user_actions (user_id, group_name, converted, purchase_amount)
        VALUES (%s, %s, %s, %s);
    """
    return execute_query(query, (user_id, group_name, converted, purchase_amount))

def get_test_status():
    query = "SELECT status FROM ab_tests WHERE test_id = 1;"

    result = execute_query(query, fetch=True)

    if result:
        return result[0]['status']
    return "STOPPED"

def update_test_status(new_status):
    query = "UPDATE ab_tests SET status = %s WHERE test_id = 1;"

    return execute_query(query, (new_status,))


def get_conversion_stats():
    query = """
        SELECT 
            group_name, 
            COUNT(*) as visitors, 
            SUM(converted) as conversions 
        FROM user_actions 
        GROUP BY group_name
        ORDER BY group_name;
    """
    return execute_query(query, fetch=True)

def get_purchase_amounts():
    query = "SELECT group_name, purchase_amount FROM user_actions WHERE converted = 1;"
    rows = execute_query(query, fetch=True)
    
    amounts_A = [float(row['purchase_amount']) for row in rows if row['group_name'] == 'A']
    amounts_B = [float(row['purchase_amount']) for row in rows if row['group_name'] == 'B']
    
    return amounts_A, amounts_B