import streamlit as st
import sys
import os
import plotly.express as px
import pandas as pd
import sqlite3
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.crud import balance_flow, select_investment, insert_flow, insert_investment, insert_wish, select_wish, delete_wish
from database.table import create_db
from ingestion.searcher import wishes

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

create_db()

st.set_page_config(page_title="Fluxo de Caixa", layout="wide", initial_sidebar_state="expanded")

st.markdown("""
<style>
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
    .block-container { padding: 2rem 3rem 3rem 3rem; max-width: 100% !important; }
    #MainMenu, footer, header { visibility: hidden; }
    .stApp { background-color: #0d0d0d; }

    [data-testid="stSidebar"] {
        background-color: #111111 !important;
        border-right: 1px solid #222 !important;
    }
    [data-testid="stSidebar"] .stRadio label {
        font-size: 13px !important;
        color: #aaa !important;
        padding: 6px 0 !important;
    }
    [data-testid="stSidebar"] .stRadio label:hover { color: #fff !important; }

    h1 { font-size: 1.6rem !important; font-weight: 600 !important; color: #ffffff !important; letter-spacing: -0.5px; }
    h2 { font-size: 1rem !important; font-weight: 500 !important; color: #888 !important; text-transform: uppercase !important; letter-spacing: 1px !important; border-bottom: 1px solid #1e1e1e !important; padding-bottom: 0.5rem !important; margin-bottom: 1rem !important; }
    h3 { font-size: 0.85rem !important; color: #666 !important; font-weight: 400 !important; text-transform: uppercase; letter-spacing: 0.5px; }

    [data-testid="stMetric"] { background: #141414 !important; border: 1px solid #1e1e1e !important; border-radius: 10px !important; padding: 1.2rem 1.5rem !important; }
    [data-testid="stMetricLabel"] { font-size: 11px !important; color: #555 !important; text-transform: uppercase !important; letter-spacing: 1px !important; }
    [data-testid="stMetricValue"] { font-size: 1.8rem !important; font-weight: 600 !important; color: #ffffff !important; }

    [data-testid="stContainer"] { background: #141414 !important; border: 1px solid #1e1e1e !important; border-radius: 10px !important; padding: 1rem !important; }

    [data-baseweb="select"] { background: #1a1a1a !important; border-color: #2a2a2a !important; }
    [data-baseweb="input"] { background: #1a1a1a !important; border-color: #2a2a2a !important; }
    input:focus, select:focus { border-color: #1D9E75 !important; box-shadow: none !important; }

    .stTextInput label, .stNumberInput label, .stSelectbox label, .stDateInput label {
        font-size: 11px !important; color: #555 !important; text-transform: uppercase !important; letter-spacing: 0.8px !important;
    }

    .stButton button {
        background: #1a1a1a !important; border: 1px solid #2a2a2a !important; color: #fff !important;
        border-radius: 6px !important; font-size: 12px !important; font-weight: 500 !important;
        padding: 0.4rem 1.2rem !important; transition: all 0.2s !important; width: 100% !important;
    }
    .stButton button:hover { background: #1D9E75 !important; border-color: #1D9E75 !important; }

    [data-testid="stDataFrame"] { border: 1px solid #1e1e1e !important; border-radius: 10px !important; overflow: hidden !important; }
    hr { border-color: #1a1a1a !important; margin: 1.5rem 0 !important; }
    .stCaption { color: #444 !important; font-size: 11px !important; }
    .stAlert { background: #141414 !important; border: 1px solid #1e1e1e !important; border-radius: 8px !important; color: #555 !important; font-size: 12px !important; }
    .js-plotly-plot { border-radius: 10px !important; }
</style>
""", unsafe_allow_html=True)

with st.sidebar:
    st.markdown("### HQ Fluxo de Caixa")
    st.markdown("<p style='color:#444;font-size:11px;margin-top:-10px'>Controle Financeiro</p>", unsafe_allow_html=True)
    st.divider()
    st.markdown("<p style='color:#555;font-size:10px;text-transform:uppercase;letter-spacing:1px'>Ações Rápidas</p>", unsafe_allow_html=True)
    
    acao = st.radio("", ["Adicionar Gasto", "Adicionar Receita", "Adicionar Aporte", "Adicionar Desejo"])
    
    st.divider()
    
    if acao == "Adicionar Gasto":
        st.markdown("<p style='color:#fff;font-size:13px;font-weight:500'>Novo Gasto</p>", unsafe_allow_html=True)
        date = st.date_input("Data", key="sb_date")
        description = st.text_input("Descrição", key="sb_desc")
        category = st.selectbox("Categoria", ["Alimentacao", "TI", "Cartao", "Conta", "Luxo", "Saude", "Transporte", "Outros"], key="sb_cat")
        value = st.number_input("Valor", min_value=0.0, key="sb_val")
        bank = st.selectbox("Conta", ["Santander", "Nubank", "Rico", "VA"], key="sb_bank")
        if st.button("Salvar"):
            insert_flow(str(date), description, category, "Expense", value, bank)
            st.success("Salvo!")
            st.rerun()

    elif acao == "Adicionar Receita":
        st.markdown("<p style='color:#fff;font-size:13px;font-weight:500'>Nova Receita</p>", unsafe_allow_html=True)
        date = st.date_input("Data", key="sb_inc_date")
        description = st.text_input("Descrição", key="sb_inc_desc")
        value = st.number_input("Valor", min_value=0.0, key="sb_inc_val")
        bank = st.selectbox("Conta", ["Santander", "Nubank", "Rico", "VA"], key="sb_inc_bank")
        if st.button("Salvar"):
            insert_flow(str(date), description, "Renda", "Income", value, bank)
            st.success("Salvo!")
            st.rerun()

    elif acao == "Adicionar Aporte":
        st.markdown("<p style='color:#fff;font-size:13px;font-weight:500'>Novo Aporte</p>", unsafe_allow_html=True)
        inv_date = st.date_input("Data", key="sb_inv_date")
        inv_institution = st.selectbox("Instituição", ["BB", "Rico", "Nubank", "XP", "Outros"], key="sb_inv_inst")
        inv_type = st.selectbox("Tipo", ["CDI", "Ações", "FII", "Tesouro Direto", "Outros"], key="sb_inv_type")
        inv_value = st.number_input("Valor", min_value=0.0, key="sb_inv_val")
        inv_asset = st.text_input("Ativo", key="sb_inv_asset")
        if st.button("Salvar"):
            insert_investment(str(inv_date), inv_institution, inv_type, "Aporte", inv_value, inv_asset)
            st.success("Salvo!")
            st.rerun()

    elif acao == "Adicionar Desejo":
        st.markdown("<p style='color:#fff;font-size:13px;font-weight:500'>Novo Desejo</p>", unsafe_allow_html=True)
        nome = st.text_input("Nome", key="sb_wish_nome")
        busca = st.text_input("Termo de busca", key="sb_wish_busca")
        preco = st.number_input("Preço máximo", min_value=0.0, key="sb_wish_preco")
        if st.button("Adicionar"):
            desejos = wishes()
            novo = {nome: len(desejos) + 1, "search": busca, "ignore": [], "store": ["Amazon", "Magazine Luiza"], "max_value": preco}
            desejos.append(novo)
            with open(os.path.join(BASE_DIR, 'data', 'wishes.json'), 'w', encoding='utf-8') as f:
                json.dump({"wishes": desejos}, f, ensure_ascii=False, indent=4)
            st.success("Adicionado!")
            st.rerun()

st.markdown("<h1>Fluxo de Caixa</h1>", unsafe_allow_html=True)
st.markdown("<p style='color:#333;font-size:12px;margin-top:-12px;margin-bottom:24px'>Controle Financeiro Pessoal</p>", unsafe_allow_html=True)

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
    with sqlite3.connect(os.path.join(BASE_DIR, 'data', 'financas.db')) as conn:
        df = pd.read_sql_query("SELECT type, SUM(value) as total FROM flow GROUP BY type", conn)
    if not df.empty:
        fig = px.bar(df, x='type', y='total', color='type',
                    color_discrete_map={'Income': '#1D9E75', 'Expense': '#D85A30'},
                    labels={'type': '', 'total': 'R$'})
        fig.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font_color='#888', showlegend=False, margin=dict(l=0, r=0, t=20, b=0), xaxis=dict(showgrid=False), yaxis=dict(showgrid=True, gridcolor='#1a1a1a'))
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Nenhum lançamento ainda.")

st.divider()
st.header("Objetivos")
column_wish, column_add = st.columns([2, 1])
with column_wish:
    st.subheader("Meus Desejos")
    desejos = wishes()
    if not desejos:
        st.info("Nenhum desejo cadastrado ainda.")
    else:
        for desejo in desejos:
            nome = list(desejo.keys())[0]
            with st.container(border=True):
                col_a, col_b = st.columns([2, 1])
                with col_a:
                    st.markdown(f"**{nome}**")
                    st.markdown(f"<p style='color:#555;font-size:12px'>{desejo['search']}</p>", unsafe_allow_html=True)
                    st.markdown(f"<p style='color:#333;font-size:11px'>{', '.join(desejo['store'])}</p>", unsafe_allow_html=True)
                with col_b:
                    st.metric("Preço Alvo", f"R$ {desejo['max_value']:,.0f}")
with column_add:
    st.subheader("Novo Desejo")
    nome = st.text_input("Nome")
    busca = st.text_input("Termo de busca")
    preco = st.number_input("Preço máximo", min_value=0.0)
    if st.button("Adicionar"):
        novo = {nome: len(desejos) + 1, "search": busca, "ignore": [], "store": ["Amazon", "Magazine Luiza"], "max_value": preco}
        desejos.append(novo)
        with open(os.path.join(BASE_DIR, 'data', 'wishes.json'), 'w', encoding='utf-8') as f:
            json.dump({"wishes": desejos}, f, ensure_ascii=False, indent=4)
        st.success("Desejo adicionado!")
        st.rerun()

st.divider()
st.header("Extrato")
with sqlite3.connect(os.path.join(BASE_DIR, 'data', 'financas.db')) as conn:
    df_extrato = pd.read_sql_query("""
        SELECT date as Data, description as Descrição, category as Categoria, 
               type as Tipo, value as Valor, bank as Conta
        FROM flow ORDER BY date DESC LIMIT 10
    """, conn)
if not df_extrato.empty:
    st.dataframe(df_extrato, use_container_width=True, hide_index=True)
else:
    st.info("Nenhum lançamento ainda.")

st.divider()
st.header("Investimentos")
column_investment_form, column_investment_chart = st.columns([1, 2])
with column_investment_form:
    st.subheader("Adicionar Aporte")
    inv_date = st.date_input("Data", key="inv_date")
    inv_institution = st.selectbox("Instituição", ["BB", "Rico", "Nubank", "XP", "Outros"])
    inv_type = st.selectbox("Tipo", ["CDI", "Ações", "FII", "Tesouro Direto", "Outros"])
    inv_movement = st.selectbox("Movimento", ["Aporte", "Retirada"])
    inv_value = st.number_input("Valor", min_value=0.0, key="inv_value")
    inv_asset = st.text_input("Ativo", placeholder="Ex: MXRF11, SELIC...")
    if st.button("Salvar Aporte"):
        insert_investment(str(inv_date), inv_institution, inv_type, inv_movement, inv_value, inv_asset)
        st.success("Aporte salvo!")
with column_investment_chart:
    st.subheader("Carteira")
    investments = select_investment()
    if investments:
        df_inv = pd.DataFrame(investments, columns=['id', 'date', 'institution', 'type', 'movement', 'value', 'asset'])
        total = df_inv[df_inv['movement'] == 'Aporte']['value'].sum()
        st.metric("Total Investido", f"R$ {total:.2f}")
        df_grouped = df_inv.groupby('type')['value'].sum().reset_index()
        fig_inv = px.pie(df_grouped, values='value', names='type', color_discrete_sequence=['#1D9E75', '#7F77DD', '#EF9F27', '#D85A30', '#888'])
        fig_inv.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font_color='#888', margin=dict(l=0, r=0, t=20, b=0), legend=dict(font=dict(color='#555', size=11)))
        fig_inv.update_traces(textfont_color='#fff')
        st.plotly_chart(fig_inv, use_container_width=True)
    else:
        st.info("Nenhum investimento cadastrado ainda.")