import json
import random
import uuid
from datetime import datetime, timedelta

# 用户可在此处指定起始日期和天数
start_date_str = "2025-06-19"  # 起始日期 (YYYY-MM-DD)
num_days = 1                 # 生成天数

# 解析起始日期字符串为 datetime 对象
start_date = datetime.strptime(start_date_str, "%Y-%m-%d")

# 预设一些控制类药物名称列表（用于模拟不同药物，若需要）
controller_med_names = ["Symbicort", "Advair", "Flovent", "Pulmicort"]

for day in range(num_days):
    # 计算当前天的日期
    current_date = start_date + timedelta(days=day)
    # 准备当天24条小时记录的列表
    day_records = []

    # 设定每日控制药物计划时间，例如每天08:00和20:00
    schedule_hours = [8, 20]
    # 生成当天的服药事件列表和映射，用于稍后按实际小时插入记录
    med_events = []         # 列表形式存储实际发生服药的小时和记录
    schedule_to_actual = {} # 映射计划小时 -> 实际服药小时
    med_id_counter = 1

    for base_hour in schedule_hours:
        # 随机决定相对于计划时间的偏移：-1（提前）、0（准时）或 +1（延后）
        offsets = [0, -1, 1]
        weights = [0.8, 0.1, 0.1]  # 80%准时，10%提前，10%延后
        offset = random.choices(offsets, weights)[0]
        actual_hour = base_hour + offset
        # 边界检查（确保实际小时在0-23范围内）
        if actual_hour < 0:
            actual_hour = 0
        if actual_hour > 23:
            actual_hour = 23

        # 判断是否按时
        on_time = (offset == 0)
        # 生成药物记录ID和选择药物名称
        med_id = f"med-{med_id_counter:03d}"
        med_name = controller_med_names[(med_id_counter - 1) % len(controller_med_names)]
        med_id_counter += 1

        # 保存该服药事件
        med_events.append((actual_hour, {
            "id": med_id,
            "medication": med_name,
            "on_time": on_time
        }))
        # 记录计划与实际小时的对应关系
        schedule_to_actual[base_hour] = actual_hour

    # 将服药事件按实际发生小时排序
    med_events.sort(key=lambda x: x[0])

    # 遍历当天的每个小时，生成记录
    for hour in range(24):
        # 生成 hour 时间戳字符串
        hour_timestamp = current_date.replace(hour=hour, minute=0, second=0)
        hour_str = hour_timestamp.strftime("%Y-%m-%dT%H:00:00")

        # ------ 环境数据：pollen, pm25, pm10 ------
        # 花粉指数 (0-10，极少达到高值)
        r = random.random()
        if r < 0.05:  # 5% 概率高值段 8-10
            pollen_val = round(random.uniform(8, 10), 2)
        elif r < 0.20:  # 15% 概率中等 5-8
            pollen_val = round(random.uniform(5, 8), 2)
        else:  # 80% 概率低值 0-5
            pollen_val = round(random.uniform(0, 5), 2)
        # PM2.5 (0-155，同样偏向低值)
        r = random.random()
        if r < 0.05:  # 5% 概率非常高 100-155
            pm25_val = round(random.uniform(100, 155), 2)
        elif r < 0.20:  # 15% 概率较高 55-100
            pm25_val = round(random.uniform(55, 100), 2)
        else:  # 80% 概率正常 0-55
            pm25_val = round(random.uniform(0, 55), 2)
        # PM10 (0-180，偏向低值)
        r = random.random()
        if r < 0.05:  # 5% 概率非常高 150-180
            pm10_val = round(random.uniform(150, 180), 2)
        elif r < 0.20:  # 15% 概率较高 100-150
            pm10_val = round(random.uniform(100, 150), 2)
        else:  # 80% 概率正常 0-100
            pm10_val = round(random.uniform(0, 100), 2)
        # Cough_total
        cough_count = random.randint(0, 3)
        r = random.random()
        # enviornment pollution
        if (pm10_val > 70 or pm25_val > 50 or pollen_val > 80):
            if(random.random() < 0.2): #20% 
                cough_count += random.randint(0, 7)
        
        # 正常波动
        if(r < 0.45):
            cough_count += random.randint(1, 3)
        # ------ 活动评分：act_scores & last_act_score ------
        act_scores = []
        last_act_score = None
        if random.random() < 0.02:  # 2% 概率出现活动评分
            score = random.randint(0, 100)
            act_scores.append(score)
            last_act_score = score

        # ------ 药物服用情况：medication_status ------
        med_status_list = []
        # 将在此小时发生的服药事件加入列表
        while med_events and med_events[0][0] == hour:
            _, med_entry = med_events.pop(0)
            med_status_list.append(med_entry)
        # 未按时服药
        delayed_meds = False
        for med_entry in med_status_list:
            if not med_entry["on_time"]:
                delayed_meds = True
                break
        if delayed_meds:
            if(random.random() < 0.15):
                cough_count += random.randint(0, 10)
        # ------ 用户备注和缓解药：notes & reliever_total ------
        notes_list = []
        reliever_total = 0

        # 计算备注出现的基础概率
        note_probability = 0.1  # 基础 10%
        # 根据污染水平调整概率
        if pm25_val > 35 or pm10_val > 60 or pollen_val > 8:
            note_probability += 0.1  # 污染略高，增加 10%
        if pm25_val > 55 or pm10_val > 100:
            note_probability += 0.2  # 污染很高，再增加 20%
        # 根据漏服控制药调整概率
        if hour in schedule_to_actual:
            actual_hour = schedule_to_actual[hour]
            if actual_hour > hour:
                # 该小时本应服药但还未服（推迟）
                note_probability += 0.15

        # 决定生成多少条备注
        num_notes = 0
        if random.random() < note_probability:
            num_notes = 1
            # 判断触发因素数量以确定是否增加额外备注
            trigger_count = 0
            if pm25_val > 55 or pm10_val > 100:
                trigger_count += 1
            if hour in schedule_to_actual and schedule_to_actual[hour] > hour:
                trigger_count += 1
            if pollen_val > 8:
                trigger_count += 1
            # 多重触发时可能增加第二条备注
            if trigger_count > 1 and random.random() < 0.5:
                num_notes += 1
            # 非常多的触发因素，小概率出现第三条备注
            if trigger_count > 2 and random.random() < 0.3:
                num_notes += 1

        # 逐条生成备注内容
        for n in range(num_notes):
            # 判断当前情境是正面还是负面
            negative = False
            if pm25_val > 55 or pm10_val > 100 or pollen_val > 8:
                negative = True
            # 如果本小时有服药事件且是非按时（说明之前漏服，现在补服）
            if med_status_list:
                for med_entry in med_status_list:
                    if not med_entry["on_time"]:
                        negative = True
            # 根据情境选择备注文本
            if negative:
                # 负面情境：污染严重或漏服
                if pm25_val > 100 or pm10_val > 150:
                    text = "Had to use inhaler."  # 严重到需要用缓解药
                elif pm25_val > 55 or pm10_val > 100 or pollen_val > 8:
                    text = random.choice([
                        "Breathing feels a bit tight.",  # 轻度不适
                        "Feeling a bit unwell."
                    ])
                else:
                    text = random.choice([
                        "Breathing feels a bit tight.",
                        "Feeling a bit unwell."
                    ])
            else:
                # 正面或中性情境
                if pm25_val < 20 and pm10_val < 30 and pollen_val < 3:
                    text = "Good air today!"  # 空气很好
                else:
                    text = "Feeling okay."    # 状态尚可

            # 随机生成健康评分
            health_score = random.randint(50, 100)
            # 设置备注标签（早晨/下午/晚上 随机选择）
            label = random.choice(["morning", "afternoon", "evening"])
            # 加入备注列表
            notes_list.append({
                "id": str(uuid.uuid4()),
                "label": label,
                "text": text,
                "health_score": health_score
            })
            # 如果备注提到使用了吸入剂，则增加缓解药使用次数
            if "inhaler" in text:
                reliever_total += 1

        # 如果尚未记录缓解药使用，但污染极严重，可能仍有一定概率使用
        if reliever_total == 0 and (pm25_val > 100 or pm10_val > 150):
            if random.random() < 0.5:  # 50% 概率
                reliever_total = random.choice([1, 2])
                notes_list.append({
                    "id": str(uuid.uuid4()),
                    "label": random.choice(["morning", "afternoon", "evening"]),
                    "text": "Had to use inhaler.",
                    "health_score": random.randint(50, 100)
                })

        # 如果漏服控制药且此时还未补服，可能需要使用一次缓解药
        if hour in schedule_to_actual and schedule_to_actual[hour] > hour:
            if reliever_total == 0 and random.random() < 0.3:
                reliever_total = 1
                notes_list.append({
                    "id": str(uuid.uuid4()),
                    "label": random.choice(["morning", "afternoon", "evening"]),
                    "text": "Had to use inhaler.",
                    "health_score": random.randint(50, 100)
                })

        # 限制 reliever_total 不超过2
        if reliever_total > 2:
            reliever_total = 2

        # 汇总该小时记录
        record = {
            "hour": hour_str,
            "pollen": pollen_val,
            "pm25": pm25_val,
            "pm10": pm10_val,
            "cough_count": cough_count,
            "notes": notes_list,
            "reliever_total": reliever_total,
            "act_scores": act_scores,
            "last_act_score": last_act_score,
            "medication_status": med_status_list
        }
        day_records.append(record)

    # 将当天记录写入 JSON 文件
    date_str = current_date.strftime("%Y_%m_%d")
    filename = f"hourlySummary_{date_str}.json"
    with open(filename, 'w') as f:
        json.dump(day_records, f, indent=2)

    print(f"生成文件: {filename} （包含{len(day_records)}条记录）")
