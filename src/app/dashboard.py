import streamlit as st
import sys
import os
import plotly.express as px
import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.crud import balance_flow, select_investment, insert_flow
from core.table import create_db

create_db()


st.title("Fluxo de Caixa")
st.caption("Controle Financeiro")

st.divider()
st.header("Visão Geral")

column1, column2, column3 = st.columns(3)

with column1:
    balance = balance_flow()
    st.metric(label="Saldo Livre", value=f"R$ {balance:.2f}")

with column2:
    st.metric(label="Saldo VA", value="R$ 0.00")

with column3:
    investments = select_investment()
    total_invested = sum([row[5] for row in investments])
    st.metric(label="Total Investido", value=f"R$ {total_invested:.2f}")

st.divider()
st.header("Mês")

column_form, column_chart = st.columns([1, 2])

with column_form:
    st.subheader("Adicionar")
    date = st.date_input("Data")
    description = st.text_input("Descrição")
    category = st.selectbox("Categoria", ["Alimentacao", "TI", "Cartao", "Conta", "Luxo", "Saude", "Transporte", "Outros"])
    type = st.selectbox("Tipo", ["Income", "Expense"])
    value = st.number_input("Valor", min_value=0.0)
    bank = st.selectbox("Conta", ["Santander", "Nubank", "Rico", "VA"])
    
    if st.button("Salvar"):
        insert_flow(str(date), description, category, type, value, bank)
        st.success("Salvo!")

with column_chart:
    st.subheader("Resumo")
   
    income = balance_flow()
    
    import sqlite3
    with sqlite3.connect('data/financas.db') as conn:
        df = pd.read_sql_query("SELECT type, SUM(value) as total FROM flow GROUP BY type", conn)
    
    if not df.empty:
        fig = px.bar(df, x='type', y='total', color='type',
                    color_discrete_map={'Income': '#1D9E75', 'Expense': '#D85A30'},
                    labels={'type': '', 'total': 'R$'})
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Nenhum lançamento ainda. Adiciona um gasto ou receita.")

st.divider()
st.header("Objetivos")

st.divider()
st.header("Extrato")

st.divider()
st.header("Investimentos")