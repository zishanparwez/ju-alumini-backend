import time
import json
import os
from dotenv import load_dotenv
from os.path import join, dirname
from bs4 import BeautifulSoup
from selenium import webdriver as wb


# Scroll to get all data
def scroll_to_end(driver):
    #####################
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight/3)")
    time.sleep(4)
    ##########################
    # driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")
    # time.sleep(3)
    # height = driver.execute_script("return document.body.scrollHeight")
    # flag = True

    # while(flag):
    #     driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")
    #     time.sleep(3)
    #     new_height = driver.execute_script("return document.body.scrollHeight")
    #     if(new_height == height):
    #         flag = False
    #     height = new_height


# Get Alumni handle
def get_alumnus_details(src):
    try:
        soup = BeautifulSoup(src, features="html.parser")

        name_div = soup.find('div', {'class': 'flex-1 mr5'})
        image_div = soup.find(
            'div', {'class': 'pv-top-card__photo-wrapper ml0'})
        exp_section = soup.find('section', {'id': 'experience-section'})
        edu_section = soup.find('section', {'id': 'education-section'})

        name = name_div.find_all('ul')[0].find('li').get_text().strip()
        loc = name_div.find_all('ul')[1].find('li').get_text().strip()
        profile_title = name_div.find('h2').get_text().strip()
        image = image_div.find('img')['src']

        exp_a = exp_section.find('ul').find('div').find('a')
        job_title = exp_a.find('h3').get_text().strip()
        company_name = exp_a.find_all('p')[1].get_text().strip()
        date_employed = exp_a.find_all('h4')[0].find_all('span')[
            1].get_text().strip()
        employment_duration = exp_a.find_all('h4')[1].find_all('span')[
            1].get_text().strip()

        edu_a = edu_section.find('ul').find('div').find('a')
        institute_name = edu_a.find('h3').get_text().strip()
        degree_name = edu_a.find_all('p')[0].find_all('span')[
            1].get_text().strip()
        field_of_study = edu_a.find_all('p')[1].find_all('span')[
            1].get_text().strip()
        started = edu_a.find_all('time')[0].get_text().strip()
        completed = edu_a.find_all('time')[1].get_text().strip()

        # return {
        #     "name": name,
        #     "address": loc,
        #     "profile_title": profile_title,
        #     "image": image,
        #     "experience": {
        #         "company_name": company_name,
        #         "job_title": job_title,
        #         "date_employed": date_employed,
        #         "employment_duration": employment_duration
        #     },
        #     "education": {
        #         "institute_name": institute_name,
        #         "degree_name": degree_name,
        #         "field_of_study": field_of_study,
        #         "started": started,
        #         "completed": completed
        #     }
        # }

        return {
            "name": name,
            "degree": degree_name,
            "stream": field_of_study,
            "profession": profile_title,
            "company": company_name,
            "address": loc,
        }

    except:
        pass


def login(driver):
    dotenv_path = join(dirname(__file__), '../.env')
    load_dotenv(dotenv_path)

    EMAIL = os.environ.get("LINKEDIN_EMAIL")
    PASSWORD = os.environ.get("LINKEDIN_PASSWORD")

    driver.maximize_window()
    driver.get('https://www.linkedin.com')
    time.sleep(1)
    input_email = driver.find_element_by_id('session_key')
    input_email.send_keys(EMAIL)
    time.sleep(1)

    input_password = driver.find_element_by_id('session_password')
    input_password.send_keys(PASSWORD)
    time.sleep(1)

    submit_button = driver.find_element_by_xpath(
        '/html/body/main/section[1]/div[2]/form/button')
    submit_button.click()
    time.sleep(1)


def go_to_alumni_page(driver):
    driver.get('https://www.linkedin.com/school/jadavpur-university/people/')
    time.sleep(1)


def get_alumni_handles(driver):
    alumni_list = driver.find_elements_by_class_name(
        'org-people-profile-card__profile-info')

    alumni_handles = []

    for alumni_info in alumni_list:
        alumni_handle = alumni_info.find_element_by_tag_name(
            'a').get_attribute('href')

        alumni_handles.append(alumni_handle)

    return alumni_handles


def get_alumni_details(driver, alumni_handles):
    alumni_details = []

    for alumnus_handle in alumni_handles:
        time.sleep(1)
        driver.get(alumnus_handle)
        time.sleep(2)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(2)
        alumnus_details = get_alumnus_details(driver.page_source)
        if alumnus_details is None:
            pass
        else:
            alumnus_details["linkedIn"] = alumnus_handle
            alumni_details.append(alumnus_details)

    print(json.dumps(alumni_details))


if __name__ == "__main__":
    driver = wb.Chrome(
        executable_path='D:\selenium\chromedriver_win32\chromedriver.exe')

    # Login to Your Account
    login(driver)
    # Go to Alumni page
    go_to_alumni_page(driver)
    # Scroll to end of page
    scroll_to_end(driver)
    # Get alumni handles
    alumni_handles = get_alumni_handles(driver)
    # Get alumni details list
    get_alumni_details(driver, alumni_handles)

    # Close Driver
    driver.close()
    # Quit Driver
    driver.quit()
