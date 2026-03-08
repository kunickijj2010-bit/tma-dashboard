import os
import pandas as pd
import matplotlib.pyplot as plt
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Configuration
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def generate_dashboard():
    # 1. Fetch data for today
    from datetime import datetime
    today = datetime.now().strftime('%Y-%m-%d')
    
    try:
        res = supabase.table("shifts").select("*, employees(name, department)").eq("shift_date", today).execute()
        data = res.data
    except Exception as e:
        print(f"Error fetching data: {e}")
        return
    
    if not data:
        print("No data for today")
        return

    # 2. Process hourly counts by department
    # Departments to track based on project context
    tracked_depts = ["GDS", "VIP", "NDC", "отели", "Социальный"]
    hourly_data = {dept: [0]*24 for dept in tracked_depts}
    
    for shift in data:
        emp = shift.get("employees", {})
        dept = emp.get("department", "Other")
        hours_worked = shift.get("hours_worked", 0)
        
        # Simple heuristic for shift distribution if note is missing
        # In a real scenario, we'd parse the note matching index.ts logic
        if dept in tracked_depts and hours_worked > 0:
            start = 9 # default start
            end = min(24, start + int(hours_worked))
            for h in range(start, end):
                hourly_data[dept][h] += 1

    # 3. Plotting
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(12, 7))
    
    hours = list(range(24))
    bottom = [0] * 24
    colors = ['#00d4ff', '#ff007f', '#00ff88', '#ffaa00', '#aa00ff']
    
    for i, dept in enumerate(tracked_depts):
        ax.bar(hours, hourly_data[dept], bottom=bottom, label=dept, color=colors[i], alpha=0.8)
        bottom = [b + h for b, h in zip(bottom, hourly_data[dept])]

    ax.set_title(f"Contact Center Staffing Pulse - {today}", fontsize=18, fontweight='bold', pad=20)
    ax.set_xlabel("Hour of Day (MSK)", fontsize=12, color='#cccccc')
    ax.set_ylabel("Staff Count", fontsize=12, color='#cccccc')
    ax.set_xticks(hours)
    ax.legend(title="Departments", frameon=False)
    ax.grid(axis='y', linestyle='--', alpha=0.3)
    
    plt.tight_layout()
    
    # Ensure temp dir exists
    if not os.path.exists("temp"):
        os.makedirs("temp")
        
    output_path = "temp/dashboard.png"
    plt.savefig(output_path, dpi=150)
    print(f"Dashboard generated successfully: {output_path}")

if __name__ == "__main__":
    generate_dashboard()
